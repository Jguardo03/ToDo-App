import {
  deleteField,
  doc,
  getDocs,
  onSnapshot,
  runTransaction,
  updateDoc,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore';

import { DEFAULT_STATUS } from '@/constants/statuses';
import { applyStatus, counterDelta } from '@/domain/derive';
import type { Subtask } from '@/domain/types';
import { validateNewSubtask, validateSubtaskPatch } from '@/domain/validation';
import { RepositoryError } from '@/repositories/errors';
import { guard, requireExisting, toRepositoryError } from '@/repositories/firestore/guard';
import { subtaskFromData, subtaskToData, taskFromData, toTimestamp } from '@/repositories/firestore/mappers';
import { subtaskRef, subtasksCol, taskRef } from '@/repositories/firestore/paths';
import { byCreatedAt } from '@/repositories/sort';
import type { RepositoryOptions, SubtaskRepository } from '@/repositories/types';
import { assertId, assertUsername, assertValid } from '@/repositories/validate';

export function createSubtaskRepository(db: Firestore, options: RepositoryOptions = {}): SubtaskRepository {
  const now = options.now ?? (() => new Date());

  const toSubtasks = (docs: { id: string; data: () => DocumentData }[]): Subtask[] =>
    docs.map((d) => subtaskFromData(d.id, d.data())).sort(byCreatedAt);

  /** Counters for the parent task after a subtask change, never below zero. */
  const nextCounters = (
    task: { subtaskTotal: number; subtaskDone: number },
    before: Pick<Subtask, 'status'> | undefined,
    after: Pick<Subtask, 'status'> | undefined,
  ) => {
    const delta = counterDelta(before, after);
    return {
      subtaskTotal: Math.max(0, task.subtaskTotal + delta.total),
      subtaskDone: Math.max(0, task.subtaskDone + delta.done),
    };
  };

  return {
    list: (username, taskId) =>
      guard(async () => {
        assertUsername(username);
        assertId(taskId, 'task');
        return toSubtasks((await getDocs(subtasksCol(db, username, taskId))).docs);
      }),

    subscribe: (username, taskId, onData, onError) => {
      assertUsername(username);
      assertId(taskId, 'task');
      return onSnapshot(
        subtasksCol(db, username, taskId),
        (snapshot) => onData(toSubtasks(snapshot.docs)),
        (error) => onError?.(toRepositoryError(error)),
      );
    },

    create: (username, taskId, input) =>
      guard(async () => {
        assertUsername(username);
        assertId(taskId, 'task');
        assertValid(validateNewSubtask(input));
        const at = now();
        const status = input.status ?? DEFAULT_STATUS;
        const ref = doc(subtasksCol(db, username, taskId));
        const subtask: Subtask = {
          id: ref.id,
          taskId,
          name: input.name.trim(),
          description: input.description,
          priority: input.priority,
          status,
          dueAt: input.dueAt,
          ...(status === 'done' ? { completedAt: at } : {}),
          createdAt: at,
          updatedAt: at,
        };
        const parent = taskRef(db, username, taskId);
        await runTransaction(db, async (tx) => {
          const parentSnap = await tx.get(parent);
          if (!parentSnap.exists()) throw new RepositoryError('not-found', 'Task not found.');
          const counters = nextCounters(taskFromData(taskId, parentSnap.data()), undefined, subtask);
          tx.set(ref, subtaskToData(subtask));
          tx.update(parent, { ...counters, updatedAt: toTimestamp(at) });
        });
        return subtask;
      }),

    update: (username, taskId, id, patch) =>
      guard(async () => {
        assertUsername(username);
        assertId(taskId, 'task');
        assertId(id, 'subtask');
        assertValid(validateSubtaskPatch(patch));
        const changes: DocumentData = { updatedAt: toTimestamp(now()) };
        if (patch.name !== undefined) changes.name = patch.name.trim();
        if (patch.description !== undefined) changes.description = patch.description;
        if (patch.priority !== undefined) changes.priority = patch.priority;
        if (patch.dueAt !== undefined) changes.dueAt = toTimestamp(patch.dueAt);
        const ref = subtaskRef(db, username, taskId, id);
        await requireExisting(ref, 'Subtask');
        await updateDoc(ref, changes);
      }),

    setStatus: (username, taskId, id, status) =>
      guard(async () => {
        assertUsername(username);
        assertId(taskId, 'task');
        assertId(id, 'subtask');
        const parent = taskRef(db, username, taskId);
        const ref = subtaskRef(db, username, taskId, id);
        await runTransaction(db, async (tx) => {
          const [parentSnap, snap] = [await tx.get(parent), await tx.get(ref)];
          if (!parentSnap.exists()) throw new RepositoryError('not-found', 'Task not found.');
          if (!snap.exists()) throw new RepositoryError('not-found', 'Subtask not found.');
          const at = now();
          const before = subtaskFromData(id, snap.data());
          const next = applyStatus(before, status, at);
          const counters = nextCounters(taskFromData(taskId, parentSnap.data()), before, { status: next.status });
          tx.update(ref, {
            status: next.status,
            completedAt: next.completedAt ? toTimestamp(next.completedAt) : deleteField(),
            updatedAt: toTimestamp(at),
          });
          tx.update(parent, { ...counters, updatedAt: toTimestamp(at) });
        });
      }),

    remove: (username, taskId, id) =>
      guard(async () => {
        assertUsername(username);
        assertId(taskId, 'task');
        assertId(id, 'subtask');
        const parent = taskRef(db, username, taskId);
        const ref = subtaskRef(db, username, taskId, id);
        await runTransaction(db, async (tx) => {
          const [parentSnap, snap] = [await tx.get(parent), await tx.get(ref)];
          if (!snap.exists()) return;
          if (!parentSnap.exists()) throw new RepositoryError('not-found', 'Task not found.');
          const counters = nextCounters(taskFromData(taskId, parentSnap.data()), subtaskFromData(id, snap.data()), undefined);
          tx.delete(ref);
          tx.update(parent, { ...counters, updatedAt: toTimestamp(now()) });
        });
      }),
  };
}
