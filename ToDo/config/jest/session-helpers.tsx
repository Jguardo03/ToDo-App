import { Slot } from 'expo-router';
import type { ReactNode } from 'react';

import { RepositoriesProvider } from '@/context/repositories';
import { SessionProvider } from '@/context/session';
import { createMemoryRepositories } from '@/repositories/memory/memory-repositories';
import type { Repositories } from '@/repositories/types';
import type { SessionStorage, StoredSession } from '@/services/session-storage';

/** A SessionStorage that keeps the session in a variable, so tests can read what was saved. */
export function createFakeStorage(initial: StoredSession = { username: null, recent: [] }) {
  let stored = initial;
  const storage: SessionStorage = {
    load: jest.fn(async () => stored),
    save: jest.fn(async (session: StoredSession) => {
      stored = session;
    }),
  };
  return { storage, current: () => stored };
}

/** Wraps children in the providers the app uses, with in-memory data. */
export function SessionHarness({
  children,
  repositories,
  storage,
  initial,
}: {
  children: ReactNode;
  repositories: Repositories;
  storage?: SessionStorage;
  initial?: StoredSession;
}) {
  return (
    <RepositoriesProvider value={repositories}>
      <SessionProvider storage={storage} initial={initial}>
        {children}
      </SessionProvider>
    </RepositoriesProvider>
  );
}

/** Root layout for `renderRouter`: the real providers around a `Slot` or the real navigator. */
export function makeTestRoot(options: {
  repositories?: Repositories;
  initial?: StoredSession;
  storage?: SessionStorage;
  children: () => ReactNode;
}) {
  const repositories = options.repositories ?? createMemoryRepositories();
  return function TestRoot() {
    return (
      <SessionHarness repositories={repositories} initial={options.initial} storage={options.storage}>
        {options.children()}
      </SessionHarness>
    );
  };
}

export { Slot };
