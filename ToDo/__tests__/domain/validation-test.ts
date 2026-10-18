import { makeNewTask, minutesFromNow } from '../../config/jest/factories';

import {
  isHexColor,
  LIMITS,
  normalizeUsername,
  validateNewCategory,
  validateNewSubtask,
  validateCategoryPatch,
  validateNewTask,
  validateSubtaskPatch,
  validateTaskPatch,
  validateUsername,
} from '@/domain/validation';

describe('username', () => {
  it('normalizes: trims, drops a leading @, lowercases', () => {
    expect(normalizeUsername('  @Rune_Dev ')).toBe('rune_dev');
  });

  it.each(['rune_dev', '@rune_dev', 'alex_designer', 'abc', 'a1_b2', 'x'.repeat(LIMITS.usernameMax)])(
    'accepts %s',
    (raw) => {
      expect(validateUsername(raw)).toEqual({ ok: true, username: normalizeUsername(raw) });
    },
  );

  it.each(['', 'ab', '   ', 'x'.repeat(LIMITS.usernameMax + 1)])('rejects "%s" for its length', (raw) => {
    expect(validateUsername(raw)).toMatchObject({ ok: false, error: expect.stringContaining('characters') });
  });

  it.each(['rune dev', 'rune-dev', 'rune.dev', 'rúne', 'rune@dev'])('rejects "%s" for its characters', (raw) => {
    expect(validateUsername(raw)).toMatchObject({ ok: false, error: expect.stringContaining('letters') });
  });
});

describe('isHexColor', () => {
  it('accepts #rrggbb only', () => {
    expect(isHexColor('#b7004f')).toBe(true);
    expect(isHexColor('#B7004F')).toBe(true);
    expect(isHexColor('b7004f')).toBe(false);
    expect(isHexColor('#b70')).toBe(false);
    expect(isHexColor('#gggggg')).toBe(false);
  });
});

describe('validateNewCategory', () => {
  const valid = { name: 'Design', description: 'Wireframes and UI kits', color: '#b7004f' };

  it('accepts a complete category', () => {
    expect(validateNewCategory(valid)).toEqual({ ok: true });
  });

  it('reports each bad field', () => {
    const result = validateNewCategory({ name: '  ', description: 'x'.repeat(LIMITS.descriptionMax + 1), color: 'red' });
    expect(result).toEqual({
      ok: false,
      errors: {
        name: 'Enter a name.',
        description: expect.any(String),
        color: 'Pick a colour.',
      },
    });
  });
});

describe('validateNewTask', () => {
  it('accepts a complete task', () => {
    expect(validateNewTask(makeNewTask())).toEqual({ ok: true });
  });

  it('requires a name and a category (category is required by the ERD)', () => {
    expect(validateNewTask(makeNewTask({ name: '', categoryId: '' }))).toEqual({
      ok: false,
      errors: { name: 'Enter a name.', categoryId: 'Choose a category.' },
    });
  });

  it('rejects a name over the limit', () => {
    const result = validateNewTask(makeNewTask({ name: 'x'.repeat(LIMITS.nameMax + 1) }));
    expect(result).toMatchObject({ ok: false, errors: { name: expect.stringContaining(String(LIMITS.nameMax)) } });
  });

  it('rejects an invalid due date', () => {
    expect(validateNewTask(makeNewTask({ dueAt: new Date('nope') }))).toMatchObject({
      ok: false,
      errors: { dueAt: 'Pick a date and time.' },
    });
  });

  it('requires the start to be before the due time', () => {
    const due = minutesFromNow(60);
    expect(validateNewTask(makeNewTask({ dueAt: due, startAt: minutesFromNow(30) }))).toEqual({ ok: true });
    expect(validateNewTask(makeNewTask({ dueAt: due, startAt: due }))).toEqual({ ok: true });
    expect(validateNewTask(makeNewTask({ dueAt: due, startAt: minutesFromNow(90) }))).toMatchObject({
      ok: false,
      errors: { startAt: expect.any(String) },
    });
  });

  it('rejects unknown priority and status values', () => {
    const bad = makeNewTask({ priority: 'normal' as never, status: 'overdue' as never });
    expect(validateNewTask(bad)).toMatchObject({
      ok: false,
      errors: { priority: expect.any(String), status: expect.any(String) },
    });
  });
});

describe('validateNewSubtask', () => {
  const valid = {
    name: 'Draft wireframe components',
    description: 'Prepare component hierarchy and tokens layout.',
    priority: 'medium' as const,
    dueAt: minutesFromNow(120),
  };

  it('accepts a complete subtask', () => {
    expect(validateNewSubtask(valid)).toEqual({ ok: true });
  });

  it('requires a name, a valid priority and a due date', () => {
    expect(validateNewSubtask({ ...valid, name: ' ', priority: 'x' as never, dueAt: new Date('nope') })).toEqual({
      ok: false,
      errors: {
        name: 'Enter a name.',
        priority: 'Choose a priority.',
        dueAt: 'Pick a date and time.',
      },
    });
  });
});

describe('patch validators only judge the fields that are present', () => {
  it('accepts an empty patch and valid partial patches', () => {
    expect(validateTaskPatch({})).toEqual({ ok: true });
    expect(validateTaskPatch({ name: 'Renamed', priority: 'urgent' })).toEqual({ ok: true });
    expect(validateCategoryPatch({ color: '#00696b' })).toEqual({ ok: true });
    expect(validateSubtaskPatch({ dueAt: minutesFromNow(30) })).toEqual({ ok: true });
  });

  it('reports only the bad patched fields', () => {
    expect(validateTaskPatch({ name: ' ' })).toEqual({ ok: false, errors: { name: 'Enter a name.' } });
    expect(validateCategoryPatch({ color: 'red' })).toEqual({ ok: false, errors: { color: 'Pick a colour.' } });
    expect(validateSubtaskPatch({ priority: 'x' as never })).toEqual({
      ok: false,
      errors: { priority: 'Choose a priority.' },
    });
  });

  it('allows clearing the start time with null and checks start against a patched due time', () => {
    expect(validateTaskPatch({ startAt: null })).toEqual({ ok: true });
    expect(validateTaskPatch({ startAt: minutesFromNow(90), dueAt: minutesFromNow(60) })).toMatchObject({
      ok: false,
      errors: { startAt: expect.any(String) },
    });
  });
});
