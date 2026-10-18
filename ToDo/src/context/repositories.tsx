import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { createRepositories } from '@/repositories';
import type { Repositories } from '@/repositories/types';

const RepositoriesContext = createContext<Repositories | null>(null);

type RepositoriesProviderProps = {
  /** Tests pass an in-memory implementation. The app passes nothing and gets the Firebase one. */
  value?: Repositories;
  children: ReactNode;
};

/** The only place the app chooses which data layer it runs on. */
export function RepositoriesProvider({ value, children }: RepositoriesProviderProps) {
  // Created on first render and only then, so the Firebase settings are read when the app really needs them.
  const repositories = useMemo(() => value ?? createRepositories(), [value]);
  return <RepositoriesContext.Provider value={repositories}>{children}</RepositoriesContext.Provider>;
}

export function useRepositories(): Repositories {
  const repositories = useContext(RepositoriesContext);
  if (!repositories) throw new Error('useRepositories must be used inside a RepositoriesProvider.');
  return repositories;
}
