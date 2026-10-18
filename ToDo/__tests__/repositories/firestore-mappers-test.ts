import { Timestamp } from 'firebase/firestore';

import { makeTask, minutesFromNow, NOW } from '../../config/jest/factories';

import type { Category, Subtask, User } from '@/domain/types';
import {
  categoryFromData,
  categoryToData,
  subtaskFromData,
  subtaskToData,
  taskFromData,
  taskToData,
  userFromData,
  userToData,
} from '@/repositories/firestore/mappers';

function hasUndefined(value: unknown): boolean {
  return Object.values(value as object).some((v) => v === undefined);
}

describe('Firestore mappers', () => {
  it('round-trips a task with optional fields', () => {
    const task = makeTask({
      startAt: minutesFromNow(30),
      completedAt: minutesFromNow(45),
      status: 'done',
      subtaskTotal: 5,
      subtaskDone: 3,
    });
    const data = taskToData(task);
    expect(data.dueAt).toBeInstanceOf(Timestamp);
    expect(taskFromData(task.id, data)).toEqual(task);
  });

  it('omits empty optional fields instead of writing undefined (Firestore rejects undefined)', () => {
    const data = taskToData(makeTask());
    expect(hasUndefined(data)).toBe(false);
    expect(data).not.toHaveProperty('startAt');
    expect(data).not.toHaveProperty('completedAt');
  });

  it('round-trips users, categories and subtasks', () => {
    const user: User = { username: 'rune_dev', displayName: 'Rune', createdAt: NOW, lastActiveAt: minutesFromNow(5) };
    expect(userFromData('rune_dev', userToData(user))).toEqual(user);
    expect(hasUndefined(userToData({ ...user, displayName: undefined }))).toBe(false);

    const category: Category = {
      id: 'c1',
      name: 'Design',
      description: 'UI',
      color: '#b7004f',
      createdAt: NOW,
      updatedAt: NOW,
    };
    expect(categoryFromData('c1', categoryToData(category))).toEqual(category);

    const subtask: Subtask = {
      id: 's1',
      taskId: 't1',
      name: 'Draft',
      description: '',
      priority: 'low',
      status: 'done',
      dueAt: NOW,
      completedAt: NOW,
      createdAt: NOW,
      updatedAt: NOW,
    };
    expect(subtaskFromData('s1', subtaskToData(subtask))).toEqual(subtask);
  });

  it('falls back to safe defaults for missing or unknown stored values', () => {
    const task = taskFromData('t1', { name: 'Broken', priority: 'normal', status: 'overdue', subtaskTotal: -4 });
    expect(task).toMatchObject({ priority: 'medium', status: 'pending', subtaskTotal: 0, subtaskDone: 0, categoryId: '' });
    expect(task.dueAt.getTime()).toBe(0);
  });
});
