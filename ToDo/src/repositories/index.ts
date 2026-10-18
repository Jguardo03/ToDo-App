import { createFirestoreRepositories } from '@/repositories/firestore';
import type { Repositories, RepositoryOptions } from '@/repositories/types';
import { getDb } from '@/services/firebase/client';

export { RepositoryError, isRepositoryError } from '@/repositories/errors';
export type { RepositoryErrorCode } from '@/repositories/errors';
export type * from '@/repositories/types';

/** The app's repositories, backed by the configured Firebase project. */
export function createRepositories(options: RepositoryOptions = {}): Repositories {
  return createFirestoreRepositories(getDb(), options);
}
