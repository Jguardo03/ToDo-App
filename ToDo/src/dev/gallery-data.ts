/** Sample data for the dev-only component gallery (`/__gallery`). Not used by the real screens. */
import type { Category, Subtask, Task } from '@/domain/types';

export const GALLERY_NOW = new Date(2026, 9, 18, 12, 0, 0);

const at = (hours: number, minutes = 0, dayOffset = 0) =>
  new Date(2026, 9, 18 + dayOffset, hours, minutes, 0, 0);

export const GALLERY_CATEGORIES: Category[] = [
  { id: 'design', name: 'Design', description: 'Wireframes and UI kits', color: '#b7004f', createdAt: GALLERY_NOW, updatedAt: GALLERY_NOW },
  { id: 'dev', name: 'Development', description: 'Building things', color: '#00696b', createdAt: GALLERY_NOW, updatedAt: GALLERY_NOW },
  { id: 'meeting', name: 'Meeting', description: 'Syncs and reviews', color: '#795600', createdAt: GALLERY_NOW, updatedAt: GALLERY_NOW },
];

const base = { description: '', createdAt: GALLERY_NOW, updatedAt: GALLERY_NOW };

export const GALLERY_TASKS: Task[] = [
  { ...base, id: 't1', categoryId: 'design', name: 'Finalize Homepage Wireframes', priority: 'high', status: 'in_process', dueAt: at(14), subtaskTotal: 5, subtaskDone: 2 },
  { ...base, id: 't2', categoryId: 'dev', name: 'API Schema Review', priority: 'urgent', status: 'in_process', dueAt: at(15, 30), subtaskTotal: 4, subtaskDone: 3 },
  { ...base, id: 't3', categoryId: 'meeting', name: 'User Testing Preparation', priority: 'medium', status: 'pending', dueAt: at(9), subtaskTotal: 0, subtaskDone: 0 },
  { ...base, id: 't4', categoryId: 'design', name: 'Brand Guidelines Refinement', priority: 'low', status: 'done', completedAt: at(11), dueAt: at(16, 0, 10), subtaskTotal: 0, subtaskDone: 0 },
];

export const GALLERY_SUBTASKS: Subtask[] = [
  { ...base, id: 's1', taskId: 't1', name: 'Draft wireframe components', priority: 'medium', status: 'done', completedAt: at(10, 30), dueAt: at(10) },
  { ...base, id: 's2', taskId: 't1', name: 'Prototype micro-interactions', priority: 'medium', status: 'pending', dueAt: at(17) },
  { ...base, id: 's3', taskId: 't1', name: 'Export Figma assets', priority: 'low', status: 'pending', dueAt: at(10, 0, 1) },
];

export const categoryById = (id: string) => GALLERY_CATEGORIES.find((c) => c.id === id);
