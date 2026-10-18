import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
import { Dimensions } from 'react-native';

import { createFakeStorage, makeTestRoot } from '../../config/jest/session-helpers';

import SignInScreen from '@/app/sign-in';
import TabsLayout from '@/app/(tabs)/_layout';
import CalendarScreen from '@/app/(tabs)/calendar';
import CategoriesScreen from '@/app/(tabs)/categories';
import HomeScreen from '@/app/(tabs)/index';
import NewTaskScreen from '@/app/task/new';
import { RootNavigator } from '@/components/layout/root-navigator';
import { createMemoryRepositories } from '@/repositories/memory/memory-repositories';
import type { StoredSession } from '@/services/session-storage';

function setWindowWidth(width: number) {
  jest.spyOn(Dimensions, 'get').mockReturnValue({ width, height: 900, scale: 1, fontScale: 1 });
}

function routes(options: { initial?: StoredSession; storage?: ReturnType<typeof createFakeStorage>['storage']; repositories?: ReturnType<typeof createMemoryRepositories> }) {
  return {
    _layout: makeTestRoot({ ...options, children: () => <RootNavigator /> }),
    'sign-in': SignInScreen,
    '(tabs)/_layout': TabsLayout,
    '(tabs)/index': HomeScreen,
    '(tabs)/calendar': CalendarScreen,
    '(tabs)/categories': CategoriesScreen,
    'task/new': NewTaskScreen,
  };
}

afterEach(() => jest.restoreAllMocks());

describe('route guard', () => {
  it('sends a signed-out visitor to the sign-in screen, whatever address they open', async () => {
    setWindowWidth(390);
    renderRouter(routes({ initial: { username: null, recent: [] } }), { initialUrl: '/calendar' });
    await waitFor(() => expect(screen).toHavePathname('/sign-in'));
    expect(screen.getByRole('header', { name: 'Welcome to ToDo' })).toBeOnTheScreen();
    expect(screen.queryByRole('tab')).toBeNull();
  });

  it('keeps a signed-in user out of the sign-in screen', async () => {
    setWindowWidth(390);
    renderRouter(routes({ initial: { username: 'rune_dev', recent: ['rune_dev'] } }), { initialUrl: '/sign-in' });
    await waitFor(() => expect(screen).not.toHavePathname('/sign-in'));
    expect(screen.getByRole('header', { name: 'Home' })).toBeOnTheScreen();
  });

  it('lets a new user create a list and lands on Home', async () => {
    setWindowWidth(390);
    const repositories = createMemoryRepositories();
    const { storage, current } = createFakeStorage();
    renderRouter(routes({ repositories, storage }), { initialUrl: '/' });

    await waitFor(() => expect(screen).toHavePathname('/sign-in'));
    fireEvent.changeText(screen.getByLabelText('Unique handle'), 'rune_dev');
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'New User' }));
    });

    await waitFor(() => expect(screen).toHavePathname('/'));
    expect(screen.getByRole('header', { name: 'Home' })).toBeOnTheScreen();
    expect(await repositories.users.exists('rune_dev')).toBe(true);
    expect(current()).toEqual({ username: 'rune_dev', recent: ['rune_dev'] });
  });

  it('shows who is signed in on a phone and signs out back to the sign-in screen', async () => {
    setWindowWidth(390);
    const { storage, current } = createFakeStorage({ username: 'rune_dev', recent: ['rune_dev'] });
    renderRouter(routes({ storage, initial: { username: 'rune_dev', recent: ['rune_dev'] } }), { initialUrl: '/' });

    expect(screen.getByText('@rune_dev')).toBeOnTheScreen();
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Sign out' }));
    });

    await waitFor(() => expect(screen).toHavePathname('/sign-in'));
    expect(current().username).toBeNull();
    expect(screen.getByRole('button', { name: '@rune_dev' })).toBeOnTheScreen();
  });

  it('shows the user and sign-out in the side nav on desktop', async () => {
    setWindowWidth(1280);
    renderRouter(routes({ initial: { username: 'rune_dev', recent: ['rune_dev'] } }), { initialUrl: '/calendar' });
    expect(screen.getByText('@rune_dev')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeOnTheScreen();
  });
});
