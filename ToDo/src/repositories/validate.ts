import { normalizeUsername, validateUsername, type Validation } from '@/domain/validation';
import { RepositoryError } from '@/repositories/errors';

/** Repositories are called with the normalized username from the session; anything else is a bug. */
export function assertUsername(username: string): void {
  const result = validateUsername(username);
  if (!result.ok || normalizeUsername(username) !== username) {
    throw new RepositoryError('invalid', `Invalid username "${username}".`);
  }
}

/** Throws `invalid` with the first field message when validation failed. */
export function assertValid<T>(validation: Validation<T>): void {
  if (validation.ok) return;
  const [message] = Object.values(validation.errors) as string[];
  throw new RepositoryError('invalid', message ?? 'Invalid input.');
}

/** Document ids are single path segments. */
export function assertId(id: string, label: string): void {
  if (!id || id.includes('/')) {
    throw new RepositoryError('invalid', `Invalid ${label} id.`);
  }
}
