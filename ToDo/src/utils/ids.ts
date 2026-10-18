let counter = 0;

/**
 * Random id for the in-memory repositories. Ids made in the same millisecond still sort in creation order
 * (the counter comes right after the timestamp). Firestore generates its own ids.
 */
export function newId(): string {
  counter += 1;
  return Date.now().toString(36) + counter.toString(36).padStart(5, '0') + Math.random().toString(36).slice(2, 6);
}
