import type { Task } from '@/domain/types';

/** Soonest due first; ties by creation time, then id, so the order is stable. */
export function byDueAt(a: Task, b: Task): number {
  return (
    a.dueAt.getTime() - b.dueAt.getTime() ||
    a.createdAt.getTime() - b.createdAt.getTime() ||
    a.id.localeCompare(b.id)
  );
}

/** Oldest first; ties by id. */
export function byCreatedAt<T extends { createdAt: Date; id: string }>(a: T, b: T): number {
  return a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id);
}
