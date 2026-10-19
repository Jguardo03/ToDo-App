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

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n: number) => String(n).padStart(2, '0');

export function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 0, 0);
}

/** "2:00 PM" */
export function formatTime(date: Date): string {
  const hours = date.getHours();
  return `${hours % 12 === 0 ? 12 : hours % 12}:${pad(date.getMinutes())} ${hours < 12 ? 'AM' : 'PM'}`;
}

/** "Oct 24, 2026, 5:00 PM" */
export function formatDateTime(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}, ${formatTime(date)}`;
}

/** Whole calendar days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: Date, to: Date): number {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / 86_400_000);
}

/** "Due 2:00 PM", "Due tomorrow • 11:00 AM", "Due Oct 28 • 4:00 PM" */
export function formatDueLabel(due: Date, now: Date): string {
  const days = daysBetween(now, due);
  if (days === 0) return `Due ${formatTime(due)}`;
  if (days === 1) return `Due tomorrow • ${formatTime(due)}`;
  if (days === -1) return `Due yesterday • ${formatTime(due)}`;
  return `Due ${MONTHS[due.getMonth()]} ${due.getDate()} • ${formatTime(due)}`;
}

/** "Today", "Tomorrow", "In 3 days", "Yesterday", "2 days ago" */
export function formatRelativeDay(date: Date, now: Date): string {
  const days = daysBetween(now, date);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  return days > 0 ? `In ${days} days` : `${-days} days ago`;
}

/** Value for an `<input type="datetime-local">`: local time as "YYYY-MM-DDTHH:mm". */
export function toDateTimeInputValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Parses "YYYY-MM-DDTHH:mm" or "YYYY-MM-DD HH:mm" as local time; undefined if it is not a real date. */
export function parseDateTimeInput(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) return undefined;
  const [year, month, day, hour, minute] = match.slice(1).map(Number);
  const date = new Date(year, month - 1, day, hour, minute, 0, 0);
  const valid =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day &&
    date.getHours() === hour &&
    date.getMinutes() === minute;
  return valid ? date : undefined;
}

/** A sensible due time for a new task: today 17:00, or tomorrow 09:00 once 17:00 has passed. */
export function defaultDueAt(now: Date): Date {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 0, 0, 0);
  if (today.getTime() > now.getTime()) return today;
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0, 0, 0);
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** "Wednesday, Oct 18" */
export function formatLongDate(date: Date): string {
  return `${WEEKDAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

/** "10:15 AM - 11:30 AM" with a start, or just "10:15 AM" without one. */
export function formatTimeRange(start: Date | undefined, end: Date): string {
  return start ? `${formatTime(start)} - ${formatTime(end)}` : formatTime(end);
}

/** The Monday on or before `date`, at 00:00 local (weeks start on Monday, as in the mockups). */
export function startOfWeek(date: Date): Date {
  const sinceMonday = (date.getDay() + 6) % 7;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - sinceMonday);
}

/** The seven local days of the week containing `date`, Monday first, each at 00:00. */
export function weekDays(date: Date): Date[] {
  const monday = startOfWeek(date);
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

/** ISO 8601 week number (the week with the year's first Thursday is week 1). */
export function isoWeekNumber(date: Date): number {
  const thursday = addDays(startOfWeek(date), 3);
  const firstThursday = startOfWeek(new Date(thursday.getFullYear(), 0, 4));
  return 1 + Math.round(daysBetween(addDays(firstThursday, 3), thursday) / 7);
}

/** "YYYY-MM-DD" of the local day: used as a map key and in the `?date=` address. */
export function toDayKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** First day of the month containing `date`, shifted by `months` (negative goes back). */
export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

/** Whole weeks (Monday-first, 7 days each) covering the month of `date`, including the neighbouring days. */
export function monthGrid(date: Date): Date[][] {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const start = startOfWeek(first);
  const weeks = Math.ceil((daysBetween(start, last) + 1) / 7);
  return Array.from({ length: weeks }, (_, week) => Array.from({ length: 7 }, (_, day) => addDays(start, week * 7 + day)));
}

/** "October 2026" */
export function formatMonthYear(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

/** "75 min", "2 h", "1 h 30 min" for the gap from `start` to `end`; undefined when `end` is not after `start`. */
export function formatDuration(start: Date, end: Date): string | undefined {
  const minutes = Math.round((end.getTime() - start.getTime()) / 60_000);
  if (minutes <= 0) return undefined;
  if (minutes < 90) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const WEEKDAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;
export const WEEKDAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
