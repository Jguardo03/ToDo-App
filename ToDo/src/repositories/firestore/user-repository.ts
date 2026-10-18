import { getDoc, runTransaction, updateDoc, type Firestore } from 'firebase/firestore';

import type { User } from '@/domain/types';
import { RepositoryError } from '@/repositories/errors';
import { guard } from '@/repositories/firestore/guard';
import { toTimestamp, userFromData, userToData } from '@/repositories/firestore/mappers';
import { userRef } from '@/repositories/firestore/paths';
import type { RepositoryOptions, UserRepository } from '@/repositories/types';
import { assertUsername } from '@/repositories/validate';

export function createUserRepository(db: Firestore, options: RepositoryOptions = {}): UserRepository {
  const now = options.now ?? (() => new Date());

  return {
    exists: (username) =>
      guard(async () => {
        assertUsername(username);
        return (await getDoc(userRef(db, username))).exists();
      }),

    get: (username) =>
      guard(async () => {
        assertUsername(username);
        const snap = await getDoc(userRef(db, username));
        return snap.exists() ? userFromData(username, snap.data()) : null;
      }),

    create: (username, displayName) =>
      guard(async () => {
        assertUsername(username);
        const createdAt = now();
        const user: User = {
          username,
          ...(displayName ? { displayName } : {}),
          createdAt,
          lastActiveAt: createdAt,
        };
        const ref = userRef(db, username);
        await runTransaction(db, async (tx) => {
          if ((await tx.get(ref)).exists()) {
            throw new RepositoryError('already-exists', 'That username is taken.');
          }
          tx.set(ref, userToData(user));
        });
        return user;
      }),

    touch: (username) =>
      guard(async () => {
        assertUsername(username);
        await updateDoc(userRef(db, username), { lastActiveAt: toTimestamp(now()) });
      }),
  };
}
