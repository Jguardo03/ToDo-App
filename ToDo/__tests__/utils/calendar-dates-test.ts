import {
  addMonths,
  formatDuration,
  formatMonthYear,
  isoWeekNumber,
  monthGrid,
  startOfWeek,
  toDayKey,
  weekDays,
} from '@/utils/dates';

describe('weeks (Monday first, device local time)', () => {
  it('startOfWeek is the Monday at 00:00, from any day of that week', () => {
    // Oct 12 2026 is a Monday, Oct 18 a Sunday.
    expect(startOfWeek(new Date(2026, 9, 12, 8, 0))).toEqual(new Date(2026, 9, 12));
    expect(startOfWeek(new Date(2026, 9, 14, 23, 59))).toEqual(new Date(2026, 9, 12));
    expect(startOfWeek(new Date(2026, 9, 18, 0, 0))).toEqual(new Date(2026, 9, 12));
    expect(startOfWeek(new Date(2026, 9, 19, 0, 0))).toEqual(new Date(2026, 9, 19));
  });

  it('weekDays gives seven consecutive calendar days, across a month and a year boundary', () => {
    expect(weekDays(new Date(2026, 9, 29)).map((d) => `${d.getMonth() + 1}/${d.getDate()}`)).toEqual([
      '10/26',
      '10/27',
      '10/28',
      '10/29',
      '10/30',
      '10/31',
      '11/1',
    ]);
    expect(weekDays(new Date(2026, 11, 31)).map(toDayKey)).toEqual([
      '2026-12-28',
      '2026-12-29',
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
      '2027-01-02',
      '2027-01-03',
    ]);
  });

  it('weekDays stays seven distinct local days on weeks with a daylight-saving change', () => {
    // US (Mar 8, Nov 1 2026) and EU (Mar 29, Oct 25 2026) clock changes, whatever the machine's zone is.
    for (const anchor of [new Date(2026, 2, 8), new Date(2026, 2, 29), new Date(2026, 9, 25), new Date(2026, 10, 1)]) {
      const days = weekDays(anchor);
      expect(days).toHaveLength(7);
      expect(new Set(days.map(toDayKey)).size).toBe(7);
      for (const day of days) expect([day.getHours(), day.getMinutes()]).toEqual([0, 0]);
      expect(days[0].getDay()).toBe(1);
      expect(days[6].getDay()).toBe(0);
    }
  });

  it('isoWeekNumber follows ISO 8601', () => {
    expect(isoWeekNumber(new Date(2024, 0, 17))).toBe(3); // the mockup's "Week 3"
    expect(isoWeekNumber(new Date(2026, 0, 1))).toBe(1);
    expect(isoWeekNumber(new Date(2026, 9, 18))).toBe(42);
    expect(isoWeekNumber(new Date(2026, 11, 31))).toBe(53); // 2026 has 53 ISO weeks
    expect(isoWeekNumber(new Date(2027, 0, 1))).toBe(53); // still the previous ISO year
    expect(isoWeekNumber(new Date(2024, 11, 30))).toBe(1); // belongs to 2025 week 1
  });

  it('toDayKey is the local day, so 23:30 stays on its own day', () => {
    expect(toDayKey(new Date(2026, 9, 18, 23, 30))).toBe('2026-10-18');
    expect(toDayKey(new Date(2026, 0, 5, 0, 0))).toBe('2026-01-05');
  });
});

describe('months', () => {
  it('addMonths returns the first of the month, across years', () => {
    expect(addMonths(new Date(2026, 9, 31), 1)).toEqual(new Date(2026, 10, 1));
    expect(addMonths(new Date(2026, 0, 15), -1)).toEqual(new Date(2025, 11, 1));
    expect(addMonths(new Date(2026, 11, 15), 1)).toEqual(new Date(2027, 0, 1));
  });

  it('monthGrid is whole Monday-first weeks that include the whole month', () => {
    const grid = monthGrid(new Date(2026, 9, 18)); // October 2026 starts on a Thursday and ends on a Saturday
    expect(grid.every((week) => week.length === 7)).toBe(true);
    expect(grid).toHaveLength(5);
    expect(toDayKey(grid[0][0])).toBe('2026-09-28');
    expect(toDayKey(grid[4][6])).toBe('2026-11-01');
    expect(grid.flat().filter((d) => d.getMonth() === 9)).toHaveLength(31);
  });

  it('monthGrid needs four weeks for a February that fits, and six when it must', () => {
    expect(monthGrid(new Date(2027, 1, 10))).toHaveLength(4); // Feb 2027: Mon 1 to Sun 28
    expect(monthGrid(new Date(2026, 7, 1))).toHaveLength(6); // Aug 2026 starts on a Saturday
  });

  it('formatMonthYear', () => {
    expect(formatMonthYear(new Date(2026, 9, 18))).toBe('October 2026');
  });
});

describe('formatDuration', () => {
  const start = new Date(2026, 9, 18, 9, 0);

  it('shows minutes under 90, then hours', () => {
    expect(formatDuration(start, new Date(2026, 9, 18, 10, 15))).toBe('75 min');
    expect(formatDuration(start, new Date(2026, 9, 18, 9, 45))).toBe('45 min');
    expect(formatDuration(start, new Date(2026, 9, 18, 11, 0))).toBe('2 h');
    expect(formatDuration(start, new Date(2026, 9, 18, 11, 30))).toBe('2 h 30 min');
  });

  it('has nothing for an empty or backwards range', () => {
    expect(formatDuration(start, start)).toBeUndefined();
    expect(formatDuration(start, new Date(2026, 9, 18, 8, 0))).toBeUndefined();
  });
});
