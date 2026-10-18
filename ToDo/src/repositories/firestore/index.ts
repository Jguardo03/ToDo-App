import type { Firestore } from 'firebase/firestore';

import { createCategoryRepository } from '@/repositories/firestore/category-repository';
import { createSubtaskRepository } from '@/repositories/firestore/subtask-repository';
import { createTaskRepository } from '@/repositories/firestore/task-repository';
import { createUserRepository } from '@/repositories/firestore/user-repository';
import type { Repositories, RepositoryOptions } from '@/repositories/types';

export function createFirestoreRepositories(db: Firestore, options: RepositoryOptions = {}): Repositories {
  return {
    users: createUserRepository(db, options),
    categories: createCategoryRepository(db, options),
    tasks: createTaskRepository(db, options),
    subtasks: createSubtaskRepository(db, options),
  };
}
