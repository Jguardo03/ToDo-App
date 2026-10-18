/**
 * The data layer the UI talks to. Screens and hooks depend on these interfaces only; there are two
 * implementations: Firestore (`./firestore`) and an in-memory fake (`./memory`) used in tests.
 *
 * Every method takes the `username` whose list is being read or written.
 * Failures are reported as `RepositoryError`.
 */

import type {
  Category,
  CategoryPatch,
  NewCategory,
  NewSubtask,
  NewTask,
  StatusKey,
  Subtask,
  SubtaskPatch,
  Task,
  TaskPatch,
  User,
} from '@/domain/types';

import type { RepositoryError } from '@/repositories/errors';

export type { CategoryPatch, SubtaskPatch, TaskPatch };

export type Unsubscribe = () => void;

/** Called with the full, current list each time it changes. */
export type ListListener<T> = (items: T[]) => void;
export type ErrorListener = (error: RepositoryError) => void;

export interface UserRepository {
  exists(username: string): Promise<boolean>;
  get(username: string): Promise<User | null>;
  /** Fails with `already-exists` if the username is taken. */
  create(username: string, displayName?: string): Promise<User>;
  /** Records the last time the list was opened. */
  touch(username: string): Promise<void>;
}

export interface CategoryRepository {
  list(username: string): Promise<Category[]>;
  subscribe(username: string, onData: ListListener<Category>, onError?: ErrorListener): Unsubscribe;
  get(username: string, id: string): Promise<Category | null>;
  create(username: string, input: NewCategory): Promise<Category>;
  update(username: string, id: string, patch: CategoryPatch): Promise<void>;
  /** Fails with `category-in-use` while any task belongs to the category. */
  remove(username: string, id: string): Promise<void>;
}

export interface TaskRepository {
  /** All tasks, soonest due first. */
  list(username: string): Promise<Task[]>;
  subscribe(username: string, onData: ListListener<Task>, onError?: ErrorListener): Unsubscribe;
  get(username: string, id: string): Promise<Task | null>;
  create(username: string, input: NewTask): Promise<Task>;
  update(username: string, id: string, patch: TaskPatch): Promise<void>;
  /** Sets `completedAt` when the task becomes done and clears it otherwise. */
  setStatus(username: string, id: string, status: StatusKey): Promise<void>;
  /** Deletes the task and all its subtasks. */
  remove(username: string, id: string): Promise<void>;
  /** Tasks whose due date-time falls on the local calendar day of `day`, soonest first. */
  listByDay(username: string, day: Date): Promise<Task[]>;
  listDueToday(username: string): Promise<Task[]>;
  listByCategory(username: string, categoryId: string): Promise<Task[]>;
  /** By stored status. `overdue` is derived, so it is not a valid argument. */
  listByStatus(username: string, status: StatusKey): Promise<Task[]>;
}

export interface SubtaskRepository {
  /** Oldest first. */
  list(username: string, taskId: string): Promise<Subtask[]>;
  subscribe(username: string, taskId: string, onData: ListListener<Subtask>, onError?: ErrorListener): Unsubscribe;
  /** Fails with `not-found` if the parent task does not exist. Updates the parent's counters. */
  create(username: string, taskId: string, input: NewSubtask): Promise<Subtask>;
  update(username: string, taskId: string, id: string, patch: SubtaskPatch): Promise<void>;
  /** Updates the parent's `subtaskDone` counter. */
  setStatus(username: string, taskId: string, id: string, status: StatusKey): Promise<void>;
  /** Updates the parent's counters. */
  remove(username: string, taskId: string, id: string): Promise<void>;
}

export interface Repositories {
  users: UserRepository;
  categories: CategoryRepository;
  tasks: TaskRepository;
  subtasks: SubtaskRepository;
}

export type RepositoryOptions = {
  /** Clock used for `createdAt`, `updatedAt` and `completedAt`. Tests inject a fixed one. */
  now?: () => Date;
};
