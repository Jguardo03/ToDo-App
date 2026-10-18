/**
 * Values the UI shows but the database never stores (docs/ERD.md, "Derived").
 * Every function takes `now` as a parameter, so tests need no fake clock.
 */

import { PRIORITIES } from '@/constants/priorities';
import type { DisplayStatusKey, StatusKey, Subtask, Task } from '@/domain/types';
import { isSameDay } from '@/utils/dates';

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

export type CounterDelta = { total: number; done: number };

/**
 * How a subtask change moves the parent task's `subtaskTotal` / `subtaskDone` counters.
 * Pass `before` as undefined for a new subtask and `after` as undefined for a removed one.
 */
export function counterDelta(
  before: Pick<Subtask, 'status'> | undefined,
  after: Pick<Subtask, 'status'> | undefined,
): CounterDelta {
  const wasDone = before?.status === 'done' ? 1 : 0;
  const isDone = after?.status === 'done' ? 1 : 0;
  return {
    total: (after ? 1 : 0) - (before ? 1 : 0),
    done: isDone - wasDone,
  };
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Tasks whose due date-time falls on the local calendar day of `now`, soonest first. Any status. */
export function selectDueToday(tasks: readonly Task[], now: Date): Task[] {
  return tasks.filter((task) => isSameDay(task.dueAt, now)).sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());
}

/** How many of the given tasks are not done yet ("12 tasks remaining"). */
export function countRemaining(tasks: readonly Pick<Task, 'status'>[]): number {
  return tasks.filter((task) => task.status !== 'done').length;
}

/** Most important first (urgent to low); ties keep soonest-due first. Does not change the input. */
export function sortByPriority(tasks: readonly Task[]): Task[] {
  return [...tasks].sort(
    (a, b) => PRIORITIES[b.priority].rank - PRIORITIES[a.priority].rank || a.dueAt.getTime() - b.dueAt.getTime(),
  );
}

/** Completion rate as a whole percent: done tasks out of all tasks (0 when there are none). */
export function completionRate(tasks: readonly Pick<Task, 'status'>[]): number {
  if (tasks.length === 0) return 0;
  return Math.round((tasks.filter((task) => task.status === 'done').length / tasks.length) * 100);
}
