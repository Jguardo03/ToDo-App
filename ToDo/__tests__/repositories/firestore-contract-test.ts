/**
 * Runs the repository contract against real Firestore.
 *
 * Off by default, so `npm test` needs no network or Firebase project. Turn it on with either:
 *  - `npm run test:firestore`  -> the real project in .env.local; creates "ct..." users and deletes them afterwards
 *  - EXPO_PUBLIC_FIRESTORE_EMULATOR_HOST=127.0.0.1:8080  -> a local emulator (needs JDK 21+)
 */
import { deleteDoc } from 'firebase/firestore';

import { describeRepositoryContract } from '../../config/jest/repository-contract';

import { createFirestoreRepositories } from '@/repositories/firestore';
import { userRef } from '@/repositories/firestore/paths';
import { getDb } from '@/services/firebase/client';

const enabled = Boolean(process.env.EXPO_PUBLIC_FIRESTORE_EMULATOR_HOST) || process.env.RUN_FIRESTORE_CONTRACT === '1';

if (enabled) {
  jest.setTimeout(60_000);

  describeRepositoryContract('firestore', () => {
    let current = new Date();
    const repos = createFirestoreRepositories(getDb(), { now: () => new Date(current) });
    return {
      repos,
      setNow: (date) => {
        current = date;
      },
      cleanup: async (usernames) => {
        for (const username of usernames) {
          for (const task of await repos.tasks.list(username)) await repos.tasks.remove(username, task.id);
          for (const category of await repos.categories.list(username)) {
            await repos.categories.remove(username, category.id);
          }
          await deleteDoc(userRef(getDb(), username));
        }
      },
    };
  });
} else {
  describe.skip('repository contract: firestore', () => {
    it('runs only with RUN_FIRESTORE_CONTRACT=1 or an emulator host', () => {});
  });
}
