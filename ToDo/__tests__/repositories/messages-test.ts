import { RepositoryError, type RepositoryErrorCode } from '@/repositories/errors';
import { userMessage } from '@/repositories/messages';

describe('userMessage', () => {
  it.each<[RepositoryErrorCode, string]>([
    ['already-exists', 'That username is taken. Choose Returning User if it is yours.'],
    ['unavailable', 'Could not reach the database. Check your connection and try again.'],
    ['permission-denied', 'The database refused the request. Please try again later.'],
    ['category-in-use', 'Move or delete the tasks in this category first.'],
  ])('writes a sentence for %s', (code, sentence) => {
    expect(userMessage(new RepositoryError(code, 'technical detail'))).toBe(sentence);
  });

  it('passes through the message of not-found and invalid errors', () => {
    expect(userMessage(new RepositoryError('not-found', 'Category not found.'))).toBe('Category not found.');
    expect(userMessage(new RepositoryError('invalid', 'Enter a name.'))).toBe('Enter a name.');
  });

  it('never shows raw errors', () => {
    expect(userMessage(new Error('socket hang up'))).toBe('Something went wrong. Please try again.');
    expect(userMessage(new RepositoryError('unknown', 'ECONNRESET'))).toBe('Something went wrong. Please try again.');
  });
});
