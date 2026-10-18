/** How many usernames the device remembers for the "Previously active on this device" list. */
export const RECENT_LIMIT = 5;

/** Puts `username` first in the recent list, without duplicates, keeping at most `RECENT_LIMIT`. */
export function rememberUsername(recent: readonly string[], username: string): string[] {
  return [username, ...recent.filter((name) => name !== username)].slice(0, RECENT_LIMIT);
}
