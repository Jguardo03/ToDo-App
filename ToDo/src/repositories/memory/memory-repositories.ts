/**
 * In-memory implementation of the repository interfaces. Used by component and hook tests, and as the
 * reference the Firestore implementation is checked against (see `config/jest/repository-contract.ts`).
 * Behaviour that tests rely on (ordering, counters, completedAt, errors) must match the Firestore version.
 */

import { applyStatus, counterDelta } from '@/domain/derive';
import type { Category, NewSubtask, NewTask, StatusKey, Subtask, Task, User } from '@/domain/types';
import {
  validateCategoryPatch,
  validateNewCategory,
  validateNewSubtask,
  validateNewTask,
  validateSubtaskPatch,
  validateTaskPatch,
} from '@/domain/validation';
import { DEFAULT_STATUS } from '@/constants/statuses';
import { RepositoryError } from '@/repositories/errors';
import type {
  CategoryRepository,
  ListListener,
  Repositories,
  RepositoryOptions,
  SubtaskRepository,
  TaskRepository,
  Unsubscribe,
  UserRepository,
} from '@/repositories/types';
import { byCreatedAt, byDueAt } from '@/repositories/sort';
import { assertId, assertUsername, assertValid } from '@/repositories/validate';
import { dayRange } from '@/utils/dates';
import { newId } from '@/utils/ids';

type UserData = {
  user: User;
  categories: Map<string, Category>;
  tasks: Map<string, Task>;
  subtasks: Map<string, Map<string, Subtask>>;
};

export function createMemoryRepositories(options: RepositoryOptions = {}): Repositories {
  const now = options.now ?? (() => new Date());
  const store = new Map<string, UserData>();
  const listeners = new Set<() => void>();

  const notify = () => listeners.forEach((emit) => emit());

  function subscribeTo<T>(read: () => T[], onData: ListListener<T>): Unsubscribe {
    let active = true;
    const emit = () => {
      if (active) onData(read());
    };
    listeners.add(emit);
    queueMicrotask(emit);
    return () => {
      active = false;
      listeners.delete(emit);
    };
  }

  function dataFor(username: string): UserData | undefined {
    assertUsername(username);
    return store.get(username);
  }

  function requireData(username: string): UserData {
    const data = dataFor(username);
    if (!data) throw new RepositoryError('not-found', `User "${username}" does not exist.`);
    return data;
  }

  function requireTask(username: string, taskId: string): Task {
    assertId(taskId, 'task');
    const task = requireData(username).tasks.get(taskId);
    if (!task) throw new RepositoryError('not-found', 'Task not found.');
    return task;
  }

  function requireSubtask(username: string, taskId: string, id: string): Subtask {
    requireTask(username, taskId);
    assertId(id, 'subtask');
    const subtask = store.get(username)?.subtasks.get(taskId)?.get(id);
    if (!subtask) throw new RepositoryError('not-found', 'Subtask not found.');
    return subtask;
  }

  const sortedTasks = (username: string) => [...(dataFor(username)?.tasks.values() ?? [])].sort(byDueAt).map(clone);
  const sortedCategories = (username: string) =>
    [...(dataFor(username)?.categories.values() ?? [])].sort(byCreatedAt).map(clone);
  const sortedSubtasks = (username: string, taskId: string) =>
    [...(dataFor(username)?.subtasks.get(taskId)?.values() ?? [])].sort(byCreatedAt).map(clone);

  function applyCounters(task: Task, before: Subtask | undefined, after: Subtask | undefined) {
    const delta = counterDelta(before, after);
    task.subtaskTotal += delta.total;
    task.subtaskDone += delta.done;
    task.updatedAt = now();
  }

  const users: UserRepository = {
    async exists(username) {
      return dataFor(username) !== undefined;
    },
    async get(username) {
      const data = dataFor(username);
      return data ? clone(data.user) : null;
    },
    async create(username, displayName) {
      if (dataFor(username)) throw new RepositoryError('already-exists', 'That username is taken.');
      const createdAt = now();
      const user: User = { username, ...(displayName ? { displayName } : {}), createdAt, lastActiveAt: createdAt };
      store.set(username, { user, categories: new Map(), tasks: new Map(), subtasks: new Map() });
      notify();
      return clone(user);
    },
    async touch(username) {
      requireData(username).user.lastActiveAt = now();
      notify();
    },
  };

  const categories: CategoryRepository = {
    async list(username) {
      return sortedCategories(username);
    },
    subscribe(username, onData) {
      return subscribeTo(() => sortedCategories(username), onData);
    },
    async get(username, id) {
      assertId(id, 'category');
      const category = dataFor(username)?.categories.get(id);
      return category ? clone(category) : null;
    },
    async create(username, input) {
      assertValid(validateNewCategory(input));
      const data = requireData(username);
      const createdAt = now();
      const category: Category = { id: newId(), ...input, name: input.name.trim(), createdAt, updatedAt: createdAt };
      data.categories.set(category.id, category);
      notify();
      return clone(category);
    },
    async update(username, id, patch) {
      assertValid(validateCategoryPatch(patch));
      assertId(id, 'category');
      const category = requireData(username).categories.get(id);
      if (!category) throw new RepositoryError('not-found', 'Category not found.');
      Object.assign(category, definedOnly(patch), { updatedAt: now() });
      if (patch.name !== undefined) category.name = patch.name.trim();
      notify();
    },
    async remove(username, id) {
      assertId(id, 'category');
      const data = requireData(username);
      if (!data.categories.has(id)) return;
      if ([...data.tasks.values()].some((task) => task.categoryId === id)) {
        throw new RepositoryError('category-in-use', 'Move or delete the tasks in this category first.');
      }
      data.categories.delete(id);
      notify();
    },
  };

  const tasks: TaskRepository = {
    async list(username) {
      return sortedTasks(username);
    },
    subscribe(username, onData) {
      return subscribeTo(() => sortedTasks(username), onData);
    },
    async get(username, id) {
      assertId(id, 'task');
      const task = dataFor(username)?.tasks.get(id);
      return task ? clone(task) : null;
    },
    async create(username, input: NewTask) {
      assertValid(validateNewTask(input));
      const data = requireData(username);
      if (!data.categories.has(input.categoryId)) throw new RepositoryError('not-found', 'Category not found.');
      const createdAt = now();
      const status = input.status ?? DEFAULT_STATUS;
      const task: Task = {
        id: newId(),
        categoryId: input.categoryId,
        name: input.name.trim(),
        description: input.description,
        priority: input.priority,
        status,
        ...(input.startAt ? { startAt: input.startAt } : {}),
        dueAt: input.dueAt,
        ...(status === 'done' ? { completedAt: createdAt } : {}),
        subtaskTotal: 0,
        subtaskDone: 0,
        createdAt,
        updatedAt: createdAt,
      };
      data.tasks.set(task.id, task);
      notify();
      return clone(task);
    },
    async update(username, id, patch) {
      assertValid(validateTaskPatch(patch));
      const task = requireTask(username, id);
      if (patch.categoryId !== undefined && !requireData(username).categories.has(patch.categoryId)) {
        throw new RepositoryError('not-found', 'Category not found.');
      }
      const { startAt, ...rest } = patch;
      Object.assign(task, definedOnly(rest), { updatedAt: now() });
      if (patch.name !== undefined) task.name = patch.name.trim();
      if (startAt === null) delete task.startAt;
      else if (startAt) task.startAt = startAt;
      notify();
    },
    async setStatus(username, id, status: StatusKey) {
      const task = requireTask(username, id);
      const at = now();
      const next = applyStatus(task, status, at);
      task.status = next.status;
      if (next.completedAt) task.completedAt = next.completedAt;
      else delete task.completedAt;
      task.updatedAt = at;
      notify();
    },
    async remove(username, id) {
      assertId(id, 'task');
      const data = requireData(username);
      data.tasks.delete(id);
      data.subtasks.delete(id);
      notify();
    },
    async listByDay(username, day) {
      const { start, end } = dayRange(day);
      return sortedTasks(username).filter((t) => t.dueAt >= start && t.dueAt < end);
    },
    async listDueToday(username) {
      return tasks.listByDay(username, now());
    },
    async listByCategory(username, categoryId) {
      return sortedTasks(username).filter((t) => t.categoryId === categoryId);
    },
    async listByStatus(username, status) {
      return sortedTasks(username).filter((t) => t.status === status);
    },
  };

  const subtasks: SubtaskRepository = {
    async list(username, taskId) {
      return sortedSubtasks(username, taskId);
    },
    subscribe(username, taskId, onData) {
      return subscribeTo(() => sortedSubtasks(username, taskId), onData);
    },
    async create(username, taskId, input: NewSubtask) {
      assertValid(validateNewSubtask(input));
      const task = requireTask(username, taskId);
      const createdAt = now();
      const status = input.status ?? DEFAULT_STATUS;
      const subtask: Subtask = {
        id: newId(),
        taskId,
        name: input.name.trim(),
        description: input.description,
        priority: input.priority,
        status,
        dueAt: input.dueAt,
        ...(status === 'done' ? { completedAt: createdAt } : {}),
        createdAt,
        updatedAt: createdAt,
      };
      const data = requireData(username);
      if (!data.subtasks.has(taskId)) data.subtasks.set(taskId, new Map());
      data.subtasks.get(taskId)!.set(subtask.id, subtask);
      applyCounters(task, undefined, subtask);
      notify();
      return clone(subtask);
    },
    async update(username, taskId, id, patch) {
      assertValid(validateSubtaskPatch(patch));
      const subtask = requireSubtask(username, taskId, id);
      Object.assign(subtask, definedOnly(patch), { updatedAt: now() });
      if (patch.name !== undefined) subtask.name = patch.name.trim();
      notify();
    },
    async setStatus(username, taskId, id, status) {
      const task = requireTask(username, taskId);
      const subtask = requireSubtask(username, taskId, id);
      const before = { ...subtask };
      const at = now();
      const next = applyStatus(subtask, status, at);
      subtask.status = next.status;
      if (next.completedAt) subtask.completedAt = next.completedAt;
      else delete subtask.completedAt;
      subtask.updatedAt = at;
      applyCounters(task, before, subtask);
      notify();
    },
    async remove(username, taskId, id) {
      const task = requireTask(username, taskId);
      assertId(id, 'subtask');
      const subtask = store.get(username)?.subtasks.get(taskId)?.get(id);
      if (!subtask) return;
      store.get(username)!.subtasks.get(taskId)!.delete(id);
      applyCounters(task, subtask, undefined);
      notify();
    },
  };

  return { users, categories, tasks, subtasks };
}

function definedOnly<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Partial<T>;
}

function clone<T>(value: T): T {
  if (value instanceof Date) return new Date(value.getTime()) as T;
  if (Array.isArray(value)) return value.map(clone) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, clone(v)])) as T;
  }
  return value;
}
