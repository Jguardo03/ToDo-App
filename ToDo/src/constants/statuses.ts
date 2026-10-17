import type { ThemeColor } from '@/constants/theme';
import type { DisplayStatusKey, StatusKey } from '@/domain/types';

export type StatusInfo = {
  key: DisplayStatusKey;
  name: string;
  /** Shown on the Status Detail screen (the ERD's Status.Description). */
  description: string;
  background: ThemeColor;
  foreground: ThemeColor;
};

/**
 * The Status entity from the ERD, plus the derived `overdue` state.
 * Only `pending`, `in_process` and `done` are ever stored.
 */
export const STATUSES: Record<DisplayStatusKey, StatusInfo> = {
  pending: {
    key: 'pending',
    name: 'Pending',
    description: 'Tasks queued up and not started yet.',
    background: 'surfaceContainerHigh',
    foreground: 'onSurfaceVariant',
  },
  in_process: {
    key: 'in_process',
    name: 'In Process',
    description: 'Tasks you are working on right now.',
    background: 'secondaryContainer',
    foreground: 'onSecondaryContainer',
  },
  done: {
    key: 'done',
    name: 'Done',
    description: 'Finished tasks.',
    background: 'primaryFixed',
    foreground: 'onPrimaryFixedVariant',
  },
  overdue: {
    key: 'overdue',
    name: 'Overdue',
    description: 'Tasks past their due date that are not done.',
    background: 'errorContainer',
    foreground: 'onErrorContainer',
  },
};

/** Statuses that can be saved on a task or subtask. */
export const STORED_STATUS_KEYS: readonly StatusKey[] = ['pending', 'in_process', 'done'];

/** Order of the lifecycle selector on the task screen and of the Home stat cards. */
export const DISPLAY_STATUS_KEYS: readonly DisplayStatusKey[] = [
  'in_process',
  'overdue',
  'done',
  'pending',
];

export const DEFAULT_STATUS: StatusKey = 'pending';

export function isStatusKey(value: unknown): value is StatusKey {
  return value === 'pending' || value === 'in_process' || value === 'done';
}
