import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useRepositories } from '@/context/repositories';
import { rememberUsername } from '@/domain/session';
import { validateUsername } from '@/domain/validation';
import { RepositoryError } from '@/repositories/errors';
import { createAsyncSessionStorage, type SessionStorage, type StoredSession } from '@/services/session-storage';

export type SessionStatus = 'loading' | 'signed-out' | 'signed-in';
/** "returning" opens an existing list; "new" creates one. */
export type SignInMode = 'returning' | 'new';
export type SignInResult = { ok: true } | { ok: false; error: string };

type SessionValue = {
  status: SessionStatus;
  username: string | null;
  recent: string[];
  signIn: (rawUsername: string, mode: SignInMode) => Promise<SignInResult>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

const defaultStorage = createAsyncSessionStorage();

type SessionProviderProps = {
  children: ReactNode;
  /** Where the session is kept. Tests pass a fake. */
  storage?: SessionStorage;
  /** Start with this session instead of reading storage (tests). */
  initial?: StoredSession;
};

function errorMessage(error: unknown): string {
  if (error instanceof RepositoryError) {
    switch (error.code) {
      case 'already-exists':
        return 'That username is taken. Choose Returning User if it is yours.';
      case 'unavailable':
        return 'Could not reach the database. Check your connection and try again.';
      case 'permission-denied':
        return 'The database refused the request. Please try again later.';
      case 'invalid':
        return error.message;
    }
  }
  return 'Something went wrong. Please try again.';
}

/** Who is using the app: the username (no password), remembered on this device. */
export function SessionProvider({ children, storage = defaultStorage, initial }: SessionProviderProps) {
  const { users } = useRepositories();
  const [status, setStatus] = useState<SessionStatus>(
    initial ? (initial.username ? 'signed-in' : 'signed-out') : 'loading',
  );
  const [username, setUsername] = useState<string | null>(initial?.username ?? null);
  const [recent, setRecent] = useState<string[]>(initial?.recent ?? []);

  useEffect(() => {
    if (initial) return;
    let cancelled = false;
    storage.load().then((stored) => {
      if (cancelled) return;
      setUsername(stored.username);
      setRecent(stored.recent);
      setStatus(stored.username ? 'signed-in' : 'signed-out');
    });
    return () => {
      cancelled = true;
    };
  }, [storage, initial]);

  const signIn = useCallback(
    async (rawUsername: string, mode: SignInMode): Promise<SignInResult> => {
      const parsed = validateUsername(rawUsername);
      if (!parsed.ok) return { ok: false, error: parsed.error };
      const name = parsed.username;

      try {
        if (mode === 'new') {
          await users.create(name);
        } else {
          if (!(await users.exists(name))) {
            return { ok: false, error: `No list found for @${name}. Choose New User to create it.` };
          }
          await users.touch(name);
        }
      } catch (error) {
        return { ok: false, error: errorMessage(error) };
      }

      const nextRecent = rememberUsername(recent, name);
      setUsername(name);
      setRecent(nextRecent);
      setStatus('signed-in');
      await storage.save({ username: name, recent: nextRecent });
      return { ok: true };
    },
    [users, recent, storage],
  );

  const signOut = useCallback(async () => {
    setUsername(null);
    setStatus('signed-out');
    await storage.save({ username: null, recent });
  }, [recent, storage]);

  const value = useMemo(
    () => ({ status, username, recent, signIn, signOut }),
    [status, username, recent, signIn, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession must be used inside a SessionProvider.');
  return session;
}
