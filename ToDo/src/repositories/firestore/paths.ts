/**
 * Firestore paths from docs/ERD.md:
 *   users/{username}
 *   users/{username}/categories/{categoryId}
 *   users/{username}/tasks/{taskId}
 *   users/{username}/tasks/{taskId}/subtasks/{subtaskId}
 */

import { collection, doc, type Firestore } from 'firebase/firestore';

export const userRef = (db: Firestore, username: string) => doc(db, 'users', username);

export const categoriesCol = (db: Firestore, username: string) => collection(db, 'users', username, 'categories');
export const categoryRef = (db: Firestore, username: string, id: string) =>
  doc(db, 'users', username, 'categories', id);

export const tasksCol = (db: Firestore, username: string) => collection(db, 'users', username, 'tasks');
export const taskRef = (db: Firestore, username: string, id: string) => doc(db, 'users', username, 'tasks', id);

export const subtasksCol = (db: Firestore, username: string, taskId: string) =>
  collection(db, 'users', username, 'tasks', taskId, 'subtasks');
export const subtaskRef = (db: Firestore, username: string, taskId: string, id: string) =>
  doc(db, 'users', username, 'tasks', taskId, 'subtasks', id);
