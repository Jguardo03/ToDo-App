/** Local-time day helpers (the app shows days in the device's time zone). */

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Adds whole calendar days, keeping the local clock time (safe across daylight-saving changes). */
export function addDays(date: Date, days: number): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + days,
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  );
}

/** Half-open range `[start, end)` covering the local calendar day of `date`. */
export function dayRange(date: Date): { start: Date; end: Date } {
  const start = startOfDay(date);
  return { start, end: addDays(start, 1) };
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
