import { makeTask } from '../../config/jest/factories';

import { countByCategory, daysWithTasks, descriptionPreview, excludeCategories, tasksOnDay, timelineTime } from '@/domain/calendar';

const at = (day: number, hours: number, minutes = 0) => new Date(2026, 9, day, hours, minutes);

describe('tasksOnDay', () => {
  const tasks = [
    makeTask({ id: 'late', name: 'Late', dueAt: at(18, 23, 30) }),
    makeTask({ id: 'next', name: 'Next day', dueAt: at(19, 0, 0) }),
    makeTask({ id: 'early', name: 'Early', dueAt: at(18, 0, 0) }),
    makeTask({ id: 'prev', name: 'Previous day', dueAt: at(17, 23, 59) }),
  ];

  it('puts a 23:30 task on its own day and not the next', () => {
    expect(tasksOnDay(tasks, at(18, 12)).map((t) => t.id)).toEqual(['early', 'late']);
    expect(tasksOnDay(tasks, at(19, 8)).map((t) => t.id)).toEqual(['next']);
  });

  it('treats midnight as the start of the new day', () => {
    expect(tasksOnDay(tasks, at(17, 12)).map((t) => t.id)).toEqual(['prev']);
    expect(tasksOnDay(tasks, at(18, 0)).map((t) => t.id)).toContain('early');
  });

  it('keeps a task that starts the evening before on its due day', () => {
    const overnight = makeTask({ id: 'night', startAt: at(17, 22), dueAt: at(18, 1) });
    expect(tasksOnDay([overnight], at(17, 12))).toEqual([]);
    expect(tasksOnDay([overnight], at(18, 12))).toEqual([overnight]);
  });

  it('orders by start time (or due time), then due time, then name, without changing the input', () => {
    const input = [
      makeTask({ id: 'c', name: 'C', dueAt: at(18, 11) }),
      makeTask({ id: 'b', name: 'B', startAt: at(18, 9), dueAt: at(18, 12) }),
      makeTask({ id: 'a', name: 'A', dueAt: at(18, 10) }),
      makeTask({ id: 'a2', name: 'A2', startAt: at(18, 9), dueAt: at(18, 12) }),
      makeTask({ id: 'a1', name: 'A1', startAt: at(18, 9), dueAt: at(18, 10) }),
    ];
    const snapshot = input.map((t) => t.id);
    expect(tasksOnDay(input, at(18, 12)).map((t) => t.id)).toEqual(['a1', 'a2', 'b', 'a', 'c']);
    expect(input.map((t) => t.id)).toEqual(snapshot);
  });

  it('has nothing on an empty day', () => {
    expect(tasksOnDay(tasks, at(25, 12))).toEqual([]);
  });
});

describe('timelineTime', () => {
  it('is the start when there is one, otherwise the due time', () => {
    expect(timelineTime(makeTask({ startAt: at(18, 9), dueAt: at(18, 10) }))).toEqual(at(18, 9));
    expect(timelineTime(makeTask({ dueAt: at(18, 10) }))).toEqual(at(18, 10));
  });
});

describe('daysWithTasks', () => {
  it('lists each due day once', () => {
    const tasks = [makeTask({ dueAt: at(18, 9) }), makeTask({ dueAt: at(18, 23, 30) }), makeTask({ dueAt: at(20, 1) })];
    expect([...daysWithTasks(tasks)].sort()).toEqual(['2026-10-18', '2026-10-20']);
  });
});

describe('category counts and filter', () => {
  const tasks = [
    makeTask({ id: '1', categoryId: 'a' }),
    makeTask({ id: '2', categoryId: 'a' }),
    makeTask({ id: '3', categoryId: 'b' }),
  ];

  it('counts per category', () => {
    expect(Object.fromEntries(countByCategory(tasks))).toEqual({ a: 2, b: 1 });
  });

  it('hides the chosen categories', () => {
    expect(excludeCategories(tasks, new Set(['a'])).map((t) => t.id)).toEqual(['3']);
    expect(excludeCategories(tasks, new Set())).toHaveLength(3);
    expect(excludeCategories(tasks, new Set(['a', 'b']))).toEqual([]);
  });
});

describe('descriptionPreview', () => {
  it('uses the first non-empty line without Markdown marks', () => {
    expect(descriptionPreview('\n\n## **Shard** Redis `cache`\nsecond line')).toBe('Shard Redis cache');
    expect(descriptionPreview('- first item\n- second')).toBe('first item');
    expect(descriptionPreview('')).toBe('');
  });
});
