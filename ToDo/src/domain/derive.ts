/**
 * Values the UI shows but the database never stores (docs/ERD.md, "Derived").
 * Every function takes `now` as a parameter, so tests need no fake clock.
 */

import type { DisplayStatusKey, StatusKey, Task } from '@/domain/types';

type WithDue = Pick<Task, 'status' | 'dueAt'>;

/** Overdue = not done and the due date-time is strictly before `now`. Due exactly now is not overdue. */
export function isOverdue(item: WithDue, now: Date): boolean {
  return item.status !== 'done' && item.dueAt.getTime() < now.getTime();
}

/** The status to display: `overdue` replaces the stored status once the deadline has passed. */
export function displayStatus(item: WithDue, now: Date): DisplayStatusKey {
  return isOverdue(item, now) ? 'overdue' : item.status;
}

/**
 * Task progress as a fraction from 0 to 1.
 * - A done task is 100%, whatever its subtasks say.
 * - With subtasks: done / total.
 * - Without subtasks: 0% until it is done.
 */
export function progress(task: Pick<Task, 'status' | 'subtaskTotal' | 'subtaskDone'>): number {
  if (task.status === 'done') return 1;
  if (task.subtaskTotal <= 0) return 0;
  return clamp01(task.subtaskDone / task.subtaskTotal);
}

/** Whole-number percent for labels such as "60% Completed". */
export function progressPercent(task: Pick<Task, 'status' | 'subtaskTotal' | 'subtaskDone'>): number {
  return Math.round(progress(task) * 100);
}

export type StatusCounts = Record<DisplayStatusKey, number>;

/** Counts per displayed status, for the Home stat cards. An overdue task counts as overdue only. */
export function statusCounts(tasks: readonly WithDue[], now: Date): StatusCounts {
  const counts: StatusCounts = { pending: 0, in_process: 0, done: 0, overdue: 0 };
  for (const task of tasks) {
    counts[displayStatus(task, now)] += 1;
  }
  return counts;
}

export type CategoryStats = {
  total: number;
  done: number;
  overdue: number;
  /** done / total from 0 to 1; 0 when the category has no tasks. */
  doneRatio: number;
};

/** Figures on the category cards and the category detail header. */
export function categoryStats(tasks: readonly WithDue[], now: Date): CategoryStats {
  const done = tasks.filter((task) => task.status === 'done').length;
  const overdue = tasks.filter((task) => isOverdue(task, now)).length;
  return {
    total: tasks.length,
    done,
    overdue,
    doneRatio: tasks.length === 0 ? 0 : done / tasks.length,
  };
}

/**
 * The status change to save: `completedAt` is set when an item becomes done and cleared when it leaves done.
 * Moving between two done states keeps the original completion time.
 */
export function applyStatus(
  current: { status: StatusKey; completedAt?: Date },
  next: StatusKey,
  now: Date,
): { status: StatusKey; completedAt: Date | undefined } {
  if (next !== 'done') return { status: next, completedAt: undefined };
  return { status: next, completedAt: current.status === 'done' ? (current.completedAt ?? now) : now };
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
