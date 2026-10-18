import { describeRepositoryContract } from '../../config/jest/repository-contract';

import { createMemoryRepositories } from '@/repositories/memory/memory-repositories';

describeRepositoryContract('in-memory', () => {
  let current = new Date();
  return {
    repos: createMemoryRepositories({ now: () => new Date(current) }),
    setNow: (date) => {
      current = date;
    },
  };
});
