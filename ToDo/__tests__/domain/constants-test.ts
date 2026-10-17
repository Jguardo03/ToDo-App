import { DEFAULT_PRIORITY, isPriorityKey, PRIORITIES, PRIORITY_KEYS } from '@/constants/priorities';
import { DISPLAY_STATUS_KEYS, isStatusKey, STATUSES, STORED_STATUS_KEYS } from '@/constants/statuses';
import { Colors } from '@/constants/theme';

describe('priorities (ERD: Priority Level)', () => {
  it('has the four canonical levels, lowest to highest', () => {
    expect(PRIORITY_KEYS).toEqual(['low', 'medium', 'high', 'urgent']);
    const ranks = PRIORITY_KEYS.map((key) => PRIORITIES[key].rank);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
    expect(new Set(ranks).size).toBe(4);
  });

  it('names match the keys and the default exists', () => {
    expect(PRIORITIES.medium.name).toBe('Medium');
    expect(PRIORITIES[DEFAULT_PRIORITY]).toBeDefined();
  });

  it('only uses colours that exist in the theme', () => {
    for (const info of Object.values(PRIORITIES)) {
      expect(Colors).toHaveProperty(info.background);
      expect(Colors).toHaveProperty(info.foreground);
      expect(Colors).toHaveProperty(info.dot);
    }
  });

  it('type-guards values', () => {
    expect(isPriorityKey('urgent')).toBe(true);
    expect(isPriorityKey('normal')).toBe(false);
    expect(isPriorityKey(undefined)).toBe(false);
  });
});

describe('statuses (ERD: Status)', () => {
  it('stores only pending, in_process and done; overdue is display-only', () => {
    expect(STORED_STATUS_KEYS).toEqual(['pending', 'in_process', 'done']);
    expect(isStatusKey('overdue')).toBe(false);
    expect(isStatusKey('done')).toBe(true);
  });

  it('shows the four lifecycle states in the mockup order', () => {
    expect(DISPLAY_STATUS_KEYS).toEqual(['in_process', 'overdue', 'done', 'pending']);
    expect(STATUSES.in_process.name).toBe('In Process');
  });

  it('has a description for every state and only theme colours', () => {
    for (const info of Object.values(STATUSES)) {
      expect(info.description.length).toBeGreaterThan(0);
      expect(Colors).toHaveProperty(info.background);
      expect(Colors).toHaveProperty(info.foreground);
    }
  });
});
