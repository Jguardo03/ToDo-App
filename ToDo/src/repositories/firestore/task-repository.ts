import {
  deleteField,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type Firestore,
  type Query,
} from 'firebase/firestore';

import { DEFAULT_STATUS } from '@/constants/statuses';
import { applyStatus } from '@/domain/derive';
import type { Task } from '@/domain/types';
import { validateNewTask, validateTaskPatch } from '@/domain/validation';
import { RepositoryError } from '@/repositories/errors';
import { guard, requireExisting, toRepositoryError } from '@/repositories/firestore/guard';
import { taskFromData, taskToData, toTimestamp } from '@/repositories/firestore/mappers';
import { categoryRef, subtasksCol, taskRef, tasksCol } from '@/repositories/firestore/paths';
import { byDueAt } from '@/repositories/sort';
import type { RepositoryOptions, TaskRepository } from '@/repositories/types';
import { assertId, assertUsername, assertValid } from '@/repositories/validate';
import { dayRange } from '@/utils/dates';

/** Documents per batched delete; Firestore allows 500 writes per batch. */
const BATCH_SIZE = 400;

export function createTaskRepository(db: Firestore, options: RepositoryOptions = {}): TaskRepository {
  const now = options.now ?? (() => new Date());

  const toTasks = (docs: { id: string; data: () => DocumentData }[]): Task[] =>
    docs.map((d) => taskFromData(d.id, d.data())).sort(byDueAt);

  const run = async (q: Query) => toTasks((await getDocs(q)).docs);

  const listByDay: TaskRepository['listByDay'] = (username, day) =>
    guard(async () => {
      assertUsername(username);
      const { start, end } = dayRange(day);
      // Range filter and order on the same field: served by the automatic single-field index.
      return run(
        query(
          tasksCol(db, username),
          where('dueAt', '>=', toTimestamp(start)),
          where('dueAt', '<', toTimestamp(end)),
          orderBy('dueAt'),
        ),
      );
    });

  return {
    list: (username) =>
      guard(async () => {
        assertUsername(username);
        return run(query(tasksCol(db, username), orderBy('dueAt')));
      }),

    subscribe: (username, onData, onError) => {
      assertUsername(username);
      return onSnapshot(
        query(tasksCol(db, username), orderBy('dueAt')),
        (snapshot) => onData(toTasks(snapshot.docs)),
        (error) => onError?.(toRepositoryError(error)),
      );
    },

    get: (username, id) =>
      guard(async () => {
        assertUsername(username);
        assertId(id, 'task');
        const snap = await getDoc(taskRef(db, username, id));
        return snap.exists() ? taskFromData(snap.id, snap.data()) : null;
      }),

    create: (username, input) =>
      guard(async () => {
        assertUsername(username);
        assertValid(validateNewTask(input));
        assertId(input.categoryId, 'category');
        if (!(await getDoc(categoryRef(db, username, input.categoryId))).exists()) {
          throw new RepositoryError('not-found', 'Category not found.');
        }
        const at = now();
        const status = input.status ?? DEFAULT_STATUS;
        const ref = doc(tasksCol(db, username));
        const task: Task = {
          id: ref.id,
          categoryId: input.categoryId,
          name: input.name.trim(),
          description: input.description,
          priority: input.priority,
          status,
          ...(input.startAt ? { startAt: input.startAt } : {}),
          dueAt: input.dueAt,
          ...(status === 'done' ? { completedAt: at } : {}),
          subtaskTotal: 0,
          subtaskDone: 0,
          createdAt: at,
          updatedAt: at,
        };
        await setDoc(ref, taskToData(task));
        return task;
      }),

    update: (username, id, patch) =>
      guard(async () => {
        assertUsername(username);
        assertId(id, 'task');
        assertValid(validateTaskPatch(patch));
        if (patch.categoryId !== undefined) {
          assertId(patch.categoryId, 'category');
          if (!(await getDoc(categoryRef(db, username, patch.categoryId))).exists()) {
            throw new RepositoryError('not-found', 'Category not found.');
          }
        }
        const changes: DocumentData = { updatedAt: toTimestamp(now()) };
        if (patch.name !== undefined) changes.name = patch.name.trim();
        if (patch.description !== undefined) changes.description = patch.description;
        if (patch.categoryId !== undefined) changes.categoryId = patch.categoryId;
        if (patch.priority !== undefined) changes.priority = patch.priority;
        if (patch.dueAt !== undefined) changes.dueAt = toTimestamp(patch.dueAt);
        if (patch.startAt === null) changes.startAt = deleteField();
        else if (patch.startAt) changes.startAt = toTimestamp(patch.startAt);
        const ref = taskRef(db, username, id);
        await requireExisting(ref, 'Task');
        if (patch.dueAt === undefined) {
          await updateDoc(ref, changes);
          return;
        }
        // A subtask may not be due after its task: moving the task earlier moves later subtasks with it,
        // in the same batch so the two never disagree. (Range filter on one field: automatic index.)
        const later = await getDocs(
          query(subtasksCol(db, username, id), where('dueAt', '>', toTimestamp(patch.dueAt))),
        );
        const batch = writeBatch(db);
        batch.update(ref, changes);
        for (const subtask of later.docs) {
          batch.update(subtask.ref, { dueAt: toTimestamp(patch.dueAt), updatedAt: changes.updatedAt });
        }
        await batch.commit();
      }),

    setStatus: (username, id, status) =>
      guard(async () => {
        assertUsername(username);
        assertId(id, 'task');
        const ref = taskRef(db, username, id);
        await runTransaction(db, async (tx) => {
          const snap = await tx.get(ref);
          if (!snap.exists()) throw new RepositoryError('not-found', 'Task not found.');
          const at = now();
          const next = applyStatus(taskFromData(id, snap.data()), status, at);
          tx.update(ref, {
            status: next.status,
            completedAt: next.completedAt ? toTimestamp(next.completedAt) : deleteField(),
            updatedAt: toTimestamp(at),
          });
        });
      }),

    remove: (username, id) =>
      guard(async () => {
        assertUsername(username);
        assertId(id, 'task');
        const subtasks = await getDocs(subtasksCol(db, username, id));
        let batch = writeBatch(db);
        let pending = 0;
        for (const subtask of subtasks.docs) {
          batch.delete(subtask.ref);
          pending += 1;
          if (pending === BATCH_SIZE) {
            await batch.commit();
            batch = writeBatch(db);
            pending = 0;
          }
        }
        batch.delete(taskRef(db, username, id));
        await batch.commit();
      }),

    listByDay,

    listDueToday: (username) => listByDay(username, now()),

    listByCategory: (username, categoryId) =>
      guard(async () => {
        assertUsername(username);
        assertId(categoryId, 'category');
        // Equality only: automatic index. Sorted in `toTasks`, so no composite index is needed.
        return run(query(tasksCol(db, username), where('categoryId', '==', categoryId)));
      }),

    listByStatus: (username, status) =>
      guard(async () => {
        assertUsername(username);
        return run(query(tasksCol(db, username), where('status', '==', status)));
      }),
  };
}
