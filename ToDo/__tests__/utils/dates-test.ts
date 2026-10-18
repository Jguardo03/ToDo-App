import { addDays, dayRange, isSameDay, startOfDay } from '@/utils/dates';

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
