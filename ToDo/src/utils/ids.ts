/** Random id for the in-memory repositories. Firestore generates its own ids. */
export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}
