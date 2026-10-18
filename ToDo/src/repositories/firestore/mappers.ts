/**
 * Firestore document data <-> domain objects.
 * Dates are stored as Firestore Timestamps. Optional fields are omitted when empty, because
 * Firestore rejects `undefined` values. Unknown enum values on read fall back to safe defaults.
 */

import { Timestamp, type DocumentData } from 'firebase/firestore';

import { DEFAULT_PRIORITY, isPriorityKey } from '@/constants/priorities';
import { DEFAULT_STATUS, isStatusKey } from '@/constants/statuses';
import type { Category, Subtask, Task, User } from '@/domain/types';

export const toTimestamp = (date: Date): Timestamp => Timestamp.fromDate(date);

const EPOCH = new Date(0);

export function toDate(value: unknown): Date {
  return value instanceof Timestamp ? value.toDate() : EPOCH;
}

function optionalDate(value: unknown): Date | undefined {
  return value instanceof Timestamp ? value.toDate() : undefined;
}

const text = (value: unknown, fallback = ''): string => (typeof value === 'string' ? value : fallback);
const count = (value: unknown): number => (typeof value === 'number' && value >= 0 ? value : 0);

export function userFromData(username: string, data: DocumentData): User {
  const displayName = text(data.displayName);
  return {
    username,
    ...(displayName ? { displayName } : {}),
    createdAt: toDate(data.createdAt),
    lastActiveAt: toDate(data.lastActiveAt),
  };
}

export function userToData(user: User): DocumentData {
  return {
    username: user.username,
    ...(user.displayName ? { displayName: user.displayName } : {}),
    createdAt: toTimestamp(user.createdAt),
    lastActiveAt: toTimestamp(user.lastActiveAt),
  };
}

export function categoryFromData(id: string, data: DocumentData): Category {
  return {
    id,
    name: text(data.name),
    description: text(data.description),
    color: text(data.color, '#000000'),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export function categoryToData(category: Category): DocumentData {
  return {
    name: category.name,
    description: category.description,
    color: category.color,
    createdAt: toTimestamp(category.createdAt),
    updatedAt: toTimestamp(category.updatedAt),
  };
}

export function taskFromData(id: string, data: DocumentData): Task {
  const startAt = optionalDate(data.startAt);
  const completedAt = optionalDate(data.completedAt);
  return {
    id,
    categoryId: text(data.categoryId),
    name: text(data.name),
    description: text(data.description),
    priority: isPriorityKey(data.priority) ? data.priority : DEFAULT_PRIORITY,
    status: isStatusKey(data.status) ? data.status : DEFAULT_STATUS,
    ...(startAt ? { startAt } : {}),
    dueAt: toDate(data.dueAt),
    ...(completedAt ? { completedAt } : {}),
    subtaskTotal: count(data.subtaskTotal),
    subtaskDone: count(data.subtaskDone),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export function taskToData(task: Task): DocumentData {
  return {
    categoryId: task.categoryId,
    name: task.name,
    description: task.description,
    priority: task.priority,
    status: task.status,
    ...(task.startAt ? { startAt: toTimestamp(task.startAt) } : {}),
    dueAt: toTimestamp(task.dueAt),
    ...(task.completedAt ? { completedAt: toTimestamp(task.completedAt) } : {}),
    subtaskTotal: task.subtaskTotal,
    subtaskDone: task.subtaskDone,
    createdAt: toTimestamp(task.createdAt),
    updatedAt: toTimestamp(task.updatedAt),
  };
}

export function subtaskFromData(id: string, data: DocumentData): Subtask {
  const completedAt = optionalDate(data.completedAt);
  return {
    id,
    taskId: text(data.taskId),
    name: text(data.name),
    description: text(data.description),
    priority: isPriorityKey(data.priority) ? data.priority : DEFAULT_PRIORITY,
    status: isStatusKey(data.status) ? data.status : DEFAULT_STATUS,
    dueAt: toDate(data.dueAt),
    ...(completedAt ? { completedAt } : {}),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export function subtaskToData(subtask: Subtask): DocumentData {
  return {
    taskId: subtask.taskId,
    name: subtask.name,
    description: subtask.description,
    priority: subtask.priority,
    status: subtask.status,
    dueAt: toTimestamp(subtask.dueAt),
    ...(subtask.completedAt ? { completedAt: toTimestamp(subtask.completedAt) } : {}),
    createdAt: toTimestamp(subtask.createdAt),
    updatedAt: toTimestamp(subtask.updatedAt),
  };
}
