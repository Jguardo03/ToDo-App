import { RepositoryError } from '@/repositories/errors';
import { guard, toRepositoryError } from '@/repositories/firestore/guard';

describe('toRepositoryError', () => {
  it.each([
    ['permission-denied', 'permission-denied'],
    ['unavailable', 'unavailable'],
    ['not-found', 'not-found'],
    ['already-exists', 'already-exists'],
    ['invalid-argument', 'invalid'],
    ['deadline-exceeded', 'unknown'],
  ])('maps Firestore code %s to %s', (firestoreCode, code) => {
    const cause = Object.assign(new Error('boom'), { code: firestoreCode });
    const error = toRepositoryError(cause);
    expect(error).toBeInstanceOf(RepositoryError);
    expect(error).toMatchObject({ code, message: 'boom', cause });
  });

  it('keeps an existing RepositoryError unchanged and wraps unknown values', () => {
    const original = new RepositoryError('category-in-use', 'busy');
    expect(toRepositoryError(original)).toBe(original);
    expect(toRepositoryError('text')).toMatchObject({ code: 'unknown' });
  });

  it('guard rethrows failures as RepositoryError', async () => {
    const failure = Object.assign(new Error('x'), { code: 'unavailable' });
    await expect(guard(() => Promise.reject(failure))).rejects.toMatchObject({ code: 'unavailable' });
    await expect(guard(async () => 42)).resolves.toBe(42);
  });
});
