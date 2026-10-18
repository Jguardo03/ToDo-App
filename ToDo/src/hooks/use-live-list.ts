import { useEffect, useState } from 'react';

import type { RepositoryError } from '@/repositories/errors';
import type { ErrorListener, ListListener, Unsubscribe } from '@/repositories/types';

/** Any repository that can stream the list of one user's items. */
export type Subscribable<T> = {
  subscribe(username: string, onData: ListListener<T>, onError?: ErrorListener): Unsubscribe;
};

export type LiveList<T> = {
  data: T[] | undefined;
  error: RepositoryError | undefined;
  /** True until the first result (or error) arrives. */
  loading: boolean;
};

type State<T> = { repository: Subscribable<T>; username: string; data?: T[]; error?: RepositoryError };

/**
 * Keeps a user's list in sync with a repository subscription. When the repository or the username changes,
 * the old subscription ends and the list is loading again.
 */
export function useLiveList<T>(repository: Subscribable<T>, username: string): LiveList<T> {
  const [state, setState] = useState<State<T>>({ repository, username });

  useEffect(() => {
    return repository.subscribe(
      username,
      (data) => setState({ repository, username, data }),
      (error) => setState({ repository, username, error }),
    );
  }, [repository, username]);

  // Results that belong to an earlier subscription are not shown for the current one.
  const current = state.repository === repository && state.username === username ? state : undefined;
  return {
    data: current?.data,
    error: current?.error,
    loading: current === undefined || (current.data === undefined && current.error === undefined),
  };
}
