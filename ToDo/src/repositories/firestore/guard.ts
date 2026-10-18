import { getDoc, type DocumentReference } from 'firebase/firestore';

import { RepositoryError, type RepositoryErrorCode } from '@/repositories/errors';

const FIRESTORE_CODES: Record<string, RepositoryErrorCode> = {
  'permission-denied': 'permission-denied',
  unavailable: 'unavailable',
  'not-found': 'not-found',
  'already-exists': 'already-exists',
  'invalid-argument': 'invalid',
};

/** Turns any thrown value into a `RepositoryError`, keeping the original as `cause`. */
export function toRepositoryError(error: unknown): RepositoryError {
  if (error instanceof RepositoryError) return error;
  const firestoreCode = (error as { code?: unknown } | null)?.code;
  const code = typeof firestoreCode === 'string' ? (FIRESTORE_CODES[firestoreCode] ?? 'unknown') : 'unknown';
  const message = error instanceof Error ? error.message : 'Unexpected database error.';
  return new RepositoryError(code, message, { cause: error });
}

/** Runs a database call and reports every failure as a `RepositoryError`. */
export async function guard<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    throw toRepositoryError(error);
  }
}

/**
 * Fails with `not-found` when the document is missing. Needed before updates: the rules read the existing
 * document, so updating a missing one would otherwise be reported as `permission-denied`.
 */
export async function requireExisting(ref: DocumentReference, label: string): Promise<void> {
  if (!(await getDoc(ref)).exists()) {
    throw new RepositoryError('not-found', `${label} not found.`);
  }
}
