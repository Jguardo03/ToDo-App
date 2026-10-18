/**
 * Domain model, from docs/ERD.md. Pure TypeScript: no Firebase, React or Expo imports.
 *
 * Ownership: every Category, Task and Subtask belongs to one user. That is expressed by the
 * Firestore path (`users/{username}/...`), so the ownership id is not repeated on the objects here.
 * Dates are `Date`; the repositories convert from and to Firestore timestamps.
 */

export type PriorityKey = 'low' | 'medium' | 'high' | 'urgent';

/** Stored statuses. `overdue` is derived, never stored (ERD correction 7). */
export type StatusKey = 'pending' | 'in_process' | 'done';

/** What the UI shows: the stored status, or `overdue` when the due date has passed. */
export type DisplayStatusKey = StatusKey | 'overdue';

export interface User {
  /** Unique handle, lowercase. Also the Firestore document id. */
  username: string;
  displayName?: string;
  createdAt: Date;
  lastActiveAt: Date;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  /** Hex colour, `#rrggbb`. */
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  categoryId: string;
  name: string;
  /** Markdown text. */
  description: string;
  priority: PriorityKey;
  status: StatusKey;
  /** Optional start, used for the Calendar time range. */
  startAt?: Date;
  dueAt: Date;
  completedAt?: Date;
  /** Denormalised counters so lists need no read per subtask (ERD correction 8). */
  subtaskTotal: number;
  subtaskDone: number;
  createdAt: Date;
  updatedAt: Date;
}

/** A subtask inherits its category from the parent task; it has none of its own. */
export interface Subtask {
  id: string;
  taskId: string;
  name: string;
  description: string;
  priority: PriorityKey;
  status: StatusKey;
  dueAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/** Input for creating a category. Ids and timestamps are set by the repository. */
export interface NewCategory {
  name: string;
  description: string;
  color: string;
}

/** Input for creating a task. New tasks start `pending` unless `status` is given. */
export interface NewTask {
  categoryId: string;
  name: string;
  description: string;
  priority: PriorityKey;
  status?: StatusKey;
  startAt?: Date;
  dueAt: Date;
}

/** Input for creating a subtask. `taskId` comes from the parent the repository is called with. */
export interface NewSubtask {
  name: string;
  description: string;
  priority: PriorityKey;
  status?: StatusKey;
  dueAt: Date;
}

export type CategoryPatch = Partial<NewCategory>;

/** Fields that can change on an existing task. `startAt: null` clears it. Status changes are separate. */
export type TaskPatch = {
  name?: string;
  description?: string;
  categoryId?: string;
  priority?: PriorityKey;
  startAt?: Date | null;
  dueAt?: Date;
};

export type SubtaskPatch = {
  name?: string;
  description?: string;
  priority?: PriorityKey;
  dueAt?: Date;
};

/** What the "new task" form produces: the task and any subtasks entered with it. */
export interface NewTaskDraft {
  task: NewTask;
  subtasks: NewSubtask[];
}
