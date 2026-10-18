export type RepositoryErrorCode =
  /** The requested document does not exist. */
  | 'not-found'
  /** A document with that id already exists (for example, a taken username). */
  | 'already-exists'
  /** The category still has tasks, so it cannot be deleted. */
  | 'category-in-use'
  /** The input failed validation before reaching the database. */
  | 'invalid'
  /** The database rules rejected the request. */
  | 'permission-denied'
  /** The database could not be reached. */
  | 'unavailable'
  | 'unknown';

/** The only error type the UI has to handle from the data layer. */
export class RepositoryError extends Error {
  readonly code: RepositoryErrorCode;

  constructor(code: RepositoryErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'RepositoryError';
    this.code = code;
  }
}

export function isRepositoryError(error: unknown): error is RepositoryError {
  return error instanceof RepositoryError;
}
