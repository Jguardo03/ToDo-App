/** Calendar rules: which tasks belong to a day, in what order, and the counts the Calendar screen shows. Pure. */

import type { Task } from '@/domain/types';
import { isSameDay, toDayKey } from '@/utils/dates';

/** When a task sits on the timeline: its start, or its due time when it has no start. */
export const timelineTime = (task: Task): Date => task.startAt ?? task.dueAt;

/**
 * Tasks that fall on the local calendar day of `day`. A task belongs to the day it is **due**
 * (same rule as `TaskRepository.listByDay`), so one that starts the evening before still shows on its due day.
 * Ordered by timeline time, then due time, then name.
 */
export function tasksOnDay(tasks: readonly Task[], day: Date): Task[] {
  return tasks
    .filter((task) => isSameDay(task.dueAt, day))
    .sort(
      (a, b) =>
        timelineTime(a).getTime() - timelineTime(b).getTime() ||
        a.dueAt.getTime() - b.dueAt.getTime() ||
        a.name.localeCompare(b.name),
    );
}

/** Day keys (`YYYY-MM-DD`) that have at least one task, for the dots under days. */
export function daysWithTasks(tasks: readonly Task[]): Set<string> {
  return new Set(tasks.map((task) => toDayKey(task.dueAt)));
}

/** How many of `tasks` each category has, by category id. */
export function countByCategory(tasks: readonly Task[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const task of tasks) counts.set(task.categoryId, (counts.get(task.categoryId) ?? 0) + 1);
  return counts;
}

/** Keeps the tasks whose category is not hidden. */
export function excludeCategories(tasks: readonly Task[], hidden: ReadonlySet<string>): Task[] {
  return hidden.size === 0 ? [...tasks] : tasks.filter((task) => !hidden.has(task.categoryId));
}

/** The first line of a task's description with simple Markdown marks removed, or '' when empty. */
export function descriptionPreview(markdown: string): string {
  const line = markdown.split('\n').find((candidate) => candidate.trim() !== '') ?? '';
  return line
    .replace(/^\s{0,3}(#{1,6}|[-*+]|\d+\.|>)\s+/, '')
    .replace(/(\*\*|__|\*|_|`)/g, '')
    .trim();
}
