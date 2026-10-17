import type { ThemeColor } from '@/constants/theme';
import type { PriorityKey } from '@/domain/types';

export type PriorityInfo = {
  key: PriorityKey;
  name: string;
  /** Sort weight: higher is more important. */
  rank: number;
  /** Chip background, chip text and the small dot, as theme tokens (mockups: category, status, add task). */
  background: ThemeColor;
  foreground: ThemeColor;
  dot: ThemeColor;
};

/** The Priority Level entity from the ERD. Fixed set, so it lives in code, not in Firestore. */
export const PRIORITIES: Record<PriorityKey, PriorityInfo> = {
  low: {
    key: 'low',
    name: 'Low',
    rank: 1,
    background: 'surfaceContainerHigh',
    foreground: 'onSurfaceVariant',
    dot: 'outline',
  },
  medium: {
    key: 'medium',
    name: 'Medium',
    rank: 2,
    background: 'tertiaryFixed',
    foreground: 'onTertiaryFixedVariant',
    dot: 'tertiary',
  },
  high: {
    key: 'high',
    name: 'High',
    rank: 3,
    background: 'primaryFixed',
    foreground: 'onPrimaryFixedVariant',
    dot: 'primary',
  },
  urgent: {
    key: 'urgent',
    name: 'Urgent',
    rank: 4,
    background: 'errorContainer',
    foreground: 'onErrorContainer',
    dot: 'error',
  },
};

/** Ascending order, as the pickers show them: Low, Medium, High, Urgent. */
export const PRIORITY_KEYS: readonly PriorityKey[] = ['low', 'medium', 'high', 'urgent'];

export const DEFAULT_PRIORITY: PriorityKey = 'medium';

export function isPriorityKey(value: unknown): value is PriorityKey {
  return typeof value === 'string' && value in PRIORITIES;
}
