import {
  addDays,
  dayRange,
  daysBetween,
  defaultDueAt,
  endOfDay,
  formatDateTime,
  formatDueLabel,
  formatLongDate,
  formatTimeRange,
  formatRelativeDay,
  formatTime,
  isSameDay,
  parseDateTimeInput,
  startOfDay,
  toDateTimeInputValue,
} from '@/utils/dates';
import { withAlpha } from '@/utils/colors';

describe('dates', () => {
  it('startOfDay zeroes the local time', () => {
    expect(startOfDay(new Date(2026, 9, 18, 15, 30, 12, 500))).toEqual(new Date(2026, 9, 18, 0, 0, 0, 0));
  });

  it('addDays moves calendar days and keeps the clock time', () => {
    expect(addDays(new Date(2026, 9, 31, 9, 15), 1)).toEqual(new Date(2026, 10, 1, 9, 15));
    expect(addDays(new Date(2026, 0, 1, 23, 59), -1)).toEqual(new Date(2025, 11, 31, 23, 59));
  });

  it('dayRange is a half-open range covering exactly one local day', () => {
    const { start, end } = dayRange(new Date(2026, 9, 18, 23, 59));
    expect(start).toEqual(new Date(2026, 9, 18, 0, 0));
    expect(end).toEqual(new Date(2026, 9, 19, 0, 0));
  });

  it('isSameDay compares local calendar days', () => {
    expect(isSameDay(new Date(2026, 9, 18, 0, 0), new Date(2026, 9, 18, 23, 59))).toBe(true);
    expect(isSameDay(new Date(2026, 9, 18, 23, 59), new Date(2026, 9, 19, 0, 0))).toBe(false);
  });
});

describe('date formatting', () => {
  const now = new Date(2026, 9, 18, 12, 0);

  it('formats 12-hour times', () => {
    expect(formatTime(new Date(2026, 9, 18, 0, 5))).toBe('12:05 AM');
    expect(formatTime(new Date(2026, 9, 18, 12, 0))).toBe('12:00 PM');
    expect(formatTime(new Date(2026, 9, 18, 14, 30))).toBe('2:30 PM');
    expect(formatDateTime(new Date(2026, 9, 24, 17, 0))).toBe('Oct 24, 2026, 5:00 PM');
  });

  it('counts whole calendar days, ignoring the time of day', () => {
    expect(daysBetween(new Date(2026, 9, 18, 23, 59), new Date(2026, 9, 19, 0, 1))).toBe(1);
    expect(daysBetween(new Date(2026, 9, 18, 0, 1), new Date(2026, 9, 17, 23, 59))).toBe(-1);
    expect(daysBetween(new Date(2026, 9, 31), new Date(2026, 10, 1))).toBe(1);
  });

  it('writes due labels like the mockups', () => {
    expect(formatDueLabel(new Date(2026, 9, 18, 14, 0), now)).toBe('Due 2:00 PM');
    expect(formatDueLabel(new Date(2026, 9, 19, 11, 0), now)).toBe('Due tomorrow • 11:00 AM');
    expect(formatDueLabel(new Date(2026, 9, 17, 9, 0), now)).toBe('Due yesterday • 9:00 AM');
    expect(formatDueLabel(new Date(2026, 9, 28, 16, 0), now)).toBe('Due Oct 28 • 4:00 PM');
  });

  it('writes relative day labels', () => {
    expect(formatRelativeDay(now, now)).toBe('Today');
    expect(formatRelativeDay(new Date(2026, 9, 19), now)).toBe('Tomorrow');
    expect(formatRelativeDay(new Date(2026, 9, 21), now)).toBe('In 3 days');
    expect(formatRelativeDay(new Date(2026, 9, 16), now)).toBe('2 days ago');
  });

  it('round-trips the datetime-local input value and rejects impossible dates', () => {
    const date = new Date(2026, 9, 24, 17, 5);
    expect(toDateTimeInputValue(date)).toBe('2026-10-24T17:05');
    expect(parseDateTimeInput('2026-10-24T17:05')).toEqual(date);
    expect(parseDateTimeInput('2026-10-24 17:05')).toEqual(date);
    expect(parseDateTimeInput('2026-02-30 10:00')).toBeUndefined();
    expect(parseDateTimeInput('2026-10-24 25:00')).toBeUndefined();
    expect(parseDateTimeInput('tomorrow')).toBeUndefined();
  });

  it('picks a default due time: today 17:00, else tomorrow 09:00', () => {
    expect(defaultDueAt(new Date(2026, 9, 18, 12, 0))).toEqual(new Date(2026, 9, 18, 17, 0));
    expect(defaultDueAt(new Date(2026, 9, 18, 17, 0))).toEqual(new Date(2026, 9, 19, 9, 0));
    expect(defaultDueAt(new Date(2026, 9, 18, 20, 0))).toEqual(new Date(2026, 9, 19, 9, 0));
    expect(endOfDay(now)).toEqual(new Date(2026, 9, 18, 23, 59));
  });
});

describe('withAlpha', () => {
  it('appends an alpha byte to a hex colour', () => {
    expect(withAlpha('#b7004f', 1)).toBe('#b7004fff');
    expect(withAlpha('#b7004f', 0)).toBe('#b7004f00');
    expect(withAlpha('#b7004f', 0.14)).toBe('#b7004f24');
    expect(withAlpha('#b7004f', 5)).toBe('#b7004fff');
  });
});

describe('Home date text', () => {
  it('writes the long date', () => {
    expect(formatLongDate(new Date(2026, 9, 18))).toBe('Sunday, Oct 18');
    expect(formatLongDate(new Date(2024, 0, 17))).toBe('Wednesday, Jan 17');
  });

  it('writes a time range, or just the due time without a start', () => {
    expect(formatTimeRange(new Date(2026, 9, 18, 10, 15), new Date(2026, 9, 18, 11, 30))).toBe('10:15 AM - 11:30 AM');
    expect(formatTimeRange(undefined, new Date(2026, 9, 18, 14, 0))).toBe('2:00 PM');
  });
});
