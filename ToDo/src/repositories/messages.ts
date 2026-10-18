import { RepositoryError } from '@/repositories/errors';

/** A sentence a person can read for any data-layer failure. */
export function userMessage(error: unknown): string {
  if (error instanceof RepositoryError) {
    switch (error.code) {
      case 'already-exists':
        return 'That username is taken. Choose Returning User if it is yours.';
      case 'unavailable':
        return 'Could not reach the database. Check your connection and try again.';
      case 'permission-denied':
        return 'The database refused the request. Please try again later.';
      case 'category-in-use':
        return 'Move or delete the tasks in this category first.';
      case 'not-found':
      case 'invalid':
        return error.message;
    }
  }
  return 'Something went wrong. Please try again.';
}
