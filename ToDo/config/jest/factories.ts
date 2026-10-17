import type { NewTask, Task } from '@/domain/types';

/** Fixed "current time" for domain tests. */
export const NOW = new Date('2026-10-18T12:00:00');

export function minutesFromNow(minutes: number): Date {
  return new Date(NOW.getTime() + minutes * 60_000);
}

export function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    categoryId: 'c1',
    name: 'Finalize Homepage Wireframes',
    description: '',
    priority: 'high',
    status: 'pending',
    dueAt: minutesFromNow(60),
    subtaskTotal: 0,
    subtaskDone: 0,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

export function makeNewTask(overrides: Partial<NewTask> = {}): NewTask {
  return {
    categoryId: 'c1',
    name: 'Finalize Homepage Wireframes',
    description: 'Prepare component hierarchy.',
    priority: 'high',
    dueAt: minutesFromNow(60),
    ...overrides,
  };
}
