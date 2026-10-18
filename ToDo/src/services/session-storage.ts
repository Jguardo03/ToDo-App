import AsyncStorage from '@react-native-async-storage/async-storage';

import { RECENT_LIMIT } from '@/domain/session';
import { normalizeUsername, validateUsername } from '@/domain/validation';

export type StoredSession = {
  /** The signed-in username, or null when signed out. */
  username: string | null;
  /** Recently used usernames, newest first. */
  recent: string[];
};

/** Where the session survives a reload. Browser storage on web, device storage on phones. */
export interface SessionStorage {
  load(): Promise<StoredSession>;
  save(session: StoredSession): Promise<void>;
}

const KEY = 'todo.session.v1';
const EMPTY: StoredSession = { username: null, recent: [] };

const isValidName = (value: unknown): value is string =>
  typeof value === 'string' && validateUsername(value).ok && normalizeUsername(value) === value;

/** Reads defensively: corrupt or tampered data becomes a signed-out session, never an error. */
export function parseStoredSession(raw: string | null): StoredSession {
  if (!raw) return EMPTY;
  try {
    const data = JSON.parse(raw) as { username?: unknown; recent?: unknown };
    const recent = Array.isArray(data.recent) ? data.recent.filter(isValidName).slice(0, RECENT_LIMIT) : [];
    return { username: isValidName(data.username) ? data.username : null, recent };
  } catch {
    return EMPTY;
  }
}

export function createAsyncSessionStorage(): SessionStorage {
  return {
    async load() {
      try {
        return parseStoredSession(await AsyncStorage.getItem(KEY));
      } catch {
        return EMPTY;
      }
    },
    async save(session) {
      try {
        await AsyncStorage.setItem(KEY, JSON.stringify(session));
      } catch {
        // Storage can be unavailable (private browsing). The session then lasts until the page is closed.
      }
    },
  };
}
