/**
 * Input rules shared by the forms (Phase 5) and, through the same limits, the Firestore rules (Phase 4).
 * Each validator returns messages meant to be shown next to the field.
 */

import { isPriorityKey } from '@/constants/priorities';
import { isStatusKey } from '@/constants/statuses';
import type {
  CategoryPatch,
  NewCategory,
  NewSubtask,
  NewTask,
  SubtaskPatch,
  TaskPatch,
} from '@/domain/types';

/** Keep in sync with firestore.rules. */
export const LIMITS = {
  usernameMin: 3,
  usernameMax: 20,
  nameMax: 80,
  descriptionMax: 2000,
} as const;

const USERNAME_PATTERN = /^[a-z0-9_]+$/;
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

export type Validation<T> = { ok: true } | { ok: false; errors: FieldErrors<T> };

export type UsernameResult = { ok: true; username: string } | { ok: false; error: string };

/** Trim, drop a leading "@" (the sign-in mockup shows "@rune_dev") and lowercase. */
export function normalizeUsername(raw: string): string {
  return raw.trim().replace(/^@/, '').toLowerCase();
}

export function validateUsername(raw: string): UsernameResult {
  const username = normalizeUsername(raw);
  if (username.length < LIMITS.usernameMin || username.length > LIMITS.usernameMax) {
    return {
      ok: false,
      error: `Use ${LIMITS.usernameMin} to ${LIMITS.usernameMax} characters.`,
    };
  }
  if (!USERNAME_PATTERN.test(username)) {
    return { ok: false, error: 'Use only letters, numbers and underscores.' };
  }
  return { ok: true, username };
}

export function isHexColor(value: string): boolean {
  return HEX_COLOR_PATTERN.test(value);
}

export function validateNewCategory(input: NewCategory): Validation<NewCategory> {
  const errors: FieldErrors<NewCategory> = {};
  setIfDefined(errors, 'name', nameError(input.name));
  setIfDefined(errors, 'description', descriptionError(input.description));
  if (!isHexColor(input.color)) errors.color = 'Pick a colour.';
  return result(errors);
}

export function validateNewTask(input: NewTask): Validation<NewTask> {
  const errors: FieldErrors<NewTask> = {};
  setIfDefined(errors, 'name', nameError(input.name));
  setIfDefined(errors, 'description', descriptionError(input.description));
  if (!input.categoryId.trim()) errors.categoryId = 'Choose a category.';
  if (!isPriorityKey(input.priority)) errors.priority = 'Choose a priority.';
  if (input.status !== undefined && !isStatusKey(input.status)) errors.status = 'Choose a status.';
  const dueError = dateError(input.dueAt);
  if (dueError) {
    errors.dueAt = dueError;
  } else if (input.startAt) {
    const startError = dateError(input.startAt);
    if (startError) errors.startAt = startError;
    else if (input.startAt.getTime() > input.dueAt.getTime()) errors.startAt = 'Start must be before the due time.';
  }
  return result(errors);
}

export function validateNewSubtask(input: NewSubtask): Validation<NewSubtask> {
  const errors: FieldErrors<NewSubtask> = {};
  setIfDefined(errors, 'name', nameError(input.name));
  setIfDefined(errors, 'description', descriptionError(input.description));
  if (!isPriorityKey(input.priority)) errors.priority = 'Choose a priority.';
  if (input.status !== undefined && !isStatusKey(input.status)) errors.status = 'Choose a status.';
  const dueError = dateError(input.dueAt);
  if (dueError) errors.dueAt = dueError;
  return result(errors);
}

/** Placeholder values stand in for fields a patch leaves out; only fields present in the patch are reported. */
const FAR_FUTURE = new Date(8_640_000_000_000_000);

export function validateCategoryPatch(patch: CategoryPatch): Validation<CategoryPatch> {
  const result = validateNewCategory({ name: 'x', description: '', color: '#000000', ...definedOnly(patch) });
  return onlyPatchedFields(result, patch);
}

export function validateTaskPatch(patch: TaskPatch): Validation<TaskPatch> {
  const { startAt, ...rest } = patch;
  const result = validateNewTask({
    categoryId: 'x',
    name: 'x',
    description: '',
    priority: 'medium',
    dueAt: FAR_FUTURE,
    ...definedOnly(rest),
    ...(startAt ? { startAt } : {}),
  });
  return onlyPatchedFields(result, patch);
}

export function validateSubtaskPatch(patch: SubtaskPatch): Validation<SubtaskPatch> {
  const result = validateNewSubtask({
    name: 'x',
    description: '',
    priority: 'medium',
    dueAt: FAR_FUTURE,
    ...definedOnly(patch),
  });
  return onlyPatchedFields(result, patch);
}

function definedOnly<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Partial<T>;
}

function onlyPatchedFields<T extends object, P extends object>(result: Validation<T>, patch: P): Validation<P> {
  if (result.ok) return { ok: true };
  const present = new Set(Object.keys(definedOnly(patch)));
  const errors = Object.fromEntries(Object.entries(result.errors).filter(([field]) => present.has(field)));
  return Object.keys(errors).length === 0 ? { ok: true } : { ok: false, errors: errors as FieldErrors<P> };
}

function nameError(raw: string): string | undefined {
  const value = raw.trim();
  if (value.length === 0) return 'Enter a name.';
  if (value.length > LIMITS.nameMax) return `Keep it under ${LIMITS.nameMax} characters.`;
  return undefined;
}

function descriptionError(raw: string): string | undefined {
  if (raw.length > LIMITS.descriptionMax) return `Keep it under ${LIMITS.descriptionMax} characters.`;
  return undefined;
}

function dateError(value: Date | undefined): string | undefined {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return 'Pick a date and time.';
  return undefined;
}

function setIfDefined<T>(errors: FieldErrors<T>, field: keyof T, message: string | undefined) {
  if (message) errors[field] = message;
}

function result<T>(errors: FieldErrors<T>): Validation<T> {
  return Object.keys(errors).length === 0 ? { ok: true } : { ok: false, errors };
}
