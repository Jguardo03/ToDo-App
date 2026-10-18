import type { Category, Task } from '@/domain/types';

/** Case-insensitive match on name or description. An empty query keeps everything. */
export function filterCategories<T extends Pick<Category, 'name' | 'description'>>(categories: readonly T[], query: string): T[] {
  const needle = query.trim().toLowerCase();
  if (needle === '') return [...categories];
  return categories.filter((category) => `${category.name} ${category.description}`.toLowerCase().includes(needle));
}

/** Tasks grouped by category id. Categories without tasks have no entry. */
export function groupTasksByCategory(tasks: readonly Task[]): Map<string, Task[]> {
  const groups = new Map<string, Task[]>();
  for (const task of tasks) {
    const list = groups.get(task.categoryId);
    if (list) list.push(task);
    else groups.set(task.categoryId, [task]);
  }
  return groups;
}

/** Active tasks first (soonest due), then done tasks (most recently due first). */
export function orderCategoryTasks(tasks: readonly Task[]): Task[] {
  const active = tasks.filter((task) => task.status !== 'done').sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());
  const done = tasks.filter((task) => task.status === 'done').sort((a, b) => b.dueAt.getTime() - a.dueAt.getTime());
  return [...active, ...done];
}
