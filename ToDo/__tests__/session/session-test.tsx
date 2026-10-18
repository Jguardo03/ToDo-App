import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { createFakeStorage, SessionHarness } from '../../config/jest/session-helpers';

import { useSession } from '@/context/session';
import { rememberUsername, RECENT_LIMIT } from '@/domain/session';
import { RepositoryError } from '@/repositories/errors';
import { createMemoryRepositories } from '@/repositories/memory/memory-repositories';
import type { Repositories } from '@/repositories/types';
import {
  createAsyncSessionStorage,
  parseStoredSession,
} from '@/services/session-storage';

function setup(options: { stored?: { username: string | null; recent: string[] }; repositories?: Repositories } = {}) {
  const repositories = options.repositories ?? createMemoryRepositories();
  const fake = createFakeStorage(options.stored);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <SessionHarness repositories={repositories} storage={fake.storage}>
      {children}
    </SessionHarness>
  );
  const hook = renderHook(() => useSession(), { wrapper });
  return { ...hook, repositories, fake };
}

describe('SessionProvider: restoring', () => {
  it('starts loading, then signed out when nothing is stored', async () => {
    const { result } = setup();
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('signed-out'));
    expect(result.current.username).toBeNull();
  });

  it('restores the stored username and recent list', async () => {
    const { result } = setup({ stored: { username: 'rune_dev', recent: ['rune_dev', 'alex_designer'] } });
    await waitFor(() => expect(result.current.status).toBe('signed-in'));
    expect(result.current.username).toBe('rune_dev');
    expect(result.current.recent).toEqual(['rune_dev', 'alex_designer']);
  });
});

describe('SessionProvider: signing in as a new user', () => {
  it('creates the user, signs in and saves the session', async () => {
    const { result, repositories, fake } = setup();
    await waitFor(() => expect(result.current.status).toBe('signed-out'));

    let outcome: unknown;
    await act(async () => {
      outcome = await result.current.signIn('  @Rune_Dev ', 'new');
    });

    expect(outcome).toEqual({ ok: true });
    expect(result.current.status).toBe('signed-in');
    expect(result.current.username).toBe('rune_dev');
    expect(await repositories.users.exists('rune_dev')).toBe(true);
    expect(fake.current()).toEqual({ username: 'rune_dev', recent: ['rune_dev'] });
  });

  it('refuses a taken username and stays signed out', async () => {
    const repositories = createMemoryRepositories();
    await repositories.users.create('rune_dev');
    const { result, fake } = setup({ repositories });
    await waitFor(() => expect(result.current.status).toBe('signed-out'));

    let outcome: unknown;
    await act(async () => {
      outcome = await result.current.signIn('rune_dev', 'new');
    });

    expect(outcome).toEqual({ ok: false, error: 'That username is taken. Choose Returning User if it is yours.' });
    expect(result.current.status).toBe('signed-out');
    expect(fake.storage.save).not.toHaveBeenCalled();
  });
});

describe('SessionProvider: signing in as a returning user', () => {
  it('opens an existing list and records the visit', async () => {
    let now = new Date('2026-10-18T10:00:00');
    const repositories = createMemoryRepositories({ now: () => now });
    await repositories.users.create('rune_dev');
    now = new Date('2026-10-18T15:00:00');
    const { result } = setup({ repositories });
    await waitFor(() => expect(result.current.status).toBe('signed-out'));

    await act(async () => {
      await result.current.signIn('rune_dev', 'returning');
    });

    expect(result.current.status).toBe('signed-in');
    expect((await repositories.users.get('rune_dev'))?.lastActiveAt).toEqual(now);
  });

  it('does not create a missing list', async () => {
    const { result, repositories } = setup();
    await waitFor(() => expect(result.current.status).toBe('signed-out'));

    let outcome: unknown;
    await act(async () => {
      outcome = await result.current.signIn('nobody_here', 'returning');
    });

    expect(outcome).toEqual({
      ok: false,
      error: 'No list found for @nobody_here. Choose New User to create it.',
    });
    expect(result.current.status).toBe('signed-out');
    expect(await repositories.users.exists('nobody_here')).toBe(false);
  });
});

describe('SessionProvider: errors', () => {
  it.each([
    ['', 'Use 3 to 20 characters.'],
    ['ab', 'Use 3 to 20 characters.'],
    ['rune dev', 'Use only letters, numbers and underscores.'],
  ])('rejects the handle "%s" without touching the database', async (handle, message) => {
    const { result, repositories } = setup();
    await waitFor(() => expect(result.current.status).toBe('signed-out'));
    let outcome: unknown;
    await act(async () => {
      outcome = await result.current.signIn(handle, 'new');
    });
    expect(outcome).toEqual({ ok: false, error: message });
    expect(await repositories.users.exists('rune_dev')).toBe(false);
  });

  it('turns a database outage into a plain message', async () => {
    const real = createMemoryRepositories();
    const repositories: Repositories = {
      ...real,
      users: {
        ...real.users,
        exists: async () => {
          throw new RepositoryError('unavailable', 'offline');
        },
      },
    };
    const { result } = setup({ repositories });
    await waitFor(() => expect(result.current.status).toBe('signed-out'));
    let outcome: unknown;
    await act(async () => {
      outcome = await result.current.signIn('rune_dev', 'returning');
    });
    expect(outcome).toEqual({
      ok: false,
      error: 'Could not reach the database. Check your connection and try again.',
    });
    expect(result.current.status).toBe('signed-out');
  });
});

describe('SessionProvider: signing out', () => {
  it('forgets the username but keeps the recent list', async () => {
    const { result, fake } = setup({ stored: { username: 'rune_dev', recent: ['rune_dev', 'alex_designer'] } });
    await waitFor(() => expect(result.current.status).toBe('signed-in'));

    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.status).toBe('signed-out');
    expect(result.current.username).toBeNull();
    expect(result.current.recent).toEqual(['rune_dev', 'alex_designer']);
    expect(fake.current()).toEqual({ username: null, recent: ['rune_dev', 'alex_designer'] });
  });
});

describe('rememberUsername', () => {
  it('moves a repeat to the front without duplicating it', () => {
    expect(rememberUsername(['a_a', 'b_b', 'c_c'], 'b_b')).toEqual(['b_b', 'a_a', 'c_c']);
  });

  it('keeps at most the limit, dropping the oldest', () => {
    const names = ['n_1', 'n_2', 'n_3', 'n_4', 'n_5'];
    expect(names).toHaveLength(RECENT_LIMIT);
    expect(rememberUsername(names, 'n_6')).toEqual(['n_6', 'n_1', 'n_2', 'n_3', 'n_4']);
  });
});

describe('session storage', () => {
  it('reads corrupt or tampered data as signed out', () => {
    expect(parseStoredSession(null)).toEqual({ username: null, recent: [] });
    expect(parseStoredSession('not json')).toEqual({ username: null, recent: [] });
    expect(parseStoredSession('{"username":"Bad Name!","recent":["ok_name",42,"X"]}')).toEqual({
      username: null,
      recent: ['ok_name'],
    });
  });

  it('round-trips through device storage', async () => {
    const storage = createAsyncSessionStorage();
    await storage.save({ username: 'rune_dev', recent: ['rune_dev', 'alex_designer'] });
    expect(await storage.load()).toEqual({ username: 'rune_dev', recent: ['rune_dev', 'alex_designer'] });
    await storage.save({ username: null, recent: ['rune_dev'] });
    expect(await storage.load()).toEqual({ username: null, recent: ['rune_dev'] });
  });
});
