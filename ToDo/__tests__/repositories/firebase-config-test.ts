import { readFirebaseConfig } from '@/services/firebase/config';

describe('readFirebaseConfig', () => {
  it('returns the trimmed settings', () => {
    expect(readFirebaseConfig({ apiKey: ' key ', projectId: 'demo-todo', appId: '1:2:web:3' })).toEqual({
      apiKey: 'key',
      projectId: 'demo-todo',
      appId: '1:2:web:3',
    });
  });

  it('names every missing variable in one error', () => {
    expect(() => readFirebaseConfig({ apiKey: 'key', projectId: ' ' })).toThrow(
      /EXPO_PUBLIC_FIREBASE_PROJECT_ID, EXPO_PUBLIC_FIREBASE_APP_ID/,
    );
  });
});
