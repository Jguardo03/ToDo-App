import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Slot } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { Dimensions } from 'react-native';

import { appRoutes } from '../config/jest/app-routes';
import { makeTestRoot } from '../config/jest/session-helpers';

import { formatLongDate } from '@/utils/dates';


const routes = {
  _layout: makeTestRoot({ initial: { username: 'rune_dev', recent: [] }, children: () => <Slot /> }),
  ...appRoutes,
};

function setWindowWidth(width: number) {
  jest
    .spyOn(Dimensions, 'get')
    .mockReturnValue({ width, height: 900, scale: 1, fontScale: 1 });
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('app shell', () => {
  it('starts on Home and shows the three main tabs plus the new-task action (phone)', () => {
    setWindowWidth(390);
    renderRouter(routes, { initialUrl: '/' });

    expect(screen.getByRole('header', { name: "Today's Focus" })).toBeOnTheScreen();
    expect(screen.getAllByRole('tab').map((tab) => tab.props.accessibilityLabel)).toEqual([
      'Home',
      'Calendar',
      'Categories',
    ]);
    expect(screen.getByRole('link', { name: 'New task' })).toBeOnTheScreen();
  });

  it('switches between Home, Calendar and Categories', async () => {
    setWindowWidth(390);
    renderRouter(routes, { initialUrl: '/' });

    fireEvent.press(screen.getByRole('tab', { name: 'Calendar' }));
    await waitFor(() => expect(screen).toHavePathname('/calendar'));
    // The Calendar's heading is the selected day, which opens on today.
    expect(screen.getByRole('header', { name: formatLongDate(new Date()) })).toBeOnTheScreen();

    fireEvent.press(screen.getByRole('tab', { name: 'Categories' }));
    await waitFor(() => expect(screen).toHavePathname('/categories'));
    expect(screen.getByRole('header', { name: 'Categories' })).toBeOnTheScreen();

    fireEvent.press(screen.getByRole('tab', { name: 'Home' }));
    await waitFor(() => expect(screen).toHavePathname('/'));
  });

  it('opens the new task route from the "+" action', async () => {
    setWindowWidth(390);
    renderRouter(routes, { initialUrl: '/' });

    fireEvent.press(screen.getByRole('link', { name: 'New task' }));
    await waitFor(() => expect(screen).toHavePathname('/task/new'));
    expect(screen.getByRole('header', { name: 'New Task' })).toBeOnTheScreen();
  });

  it('uses the side navigation on wide windows', () => {
    setWindowWidth(1280);
    renderRouter(routes, { initialUrl: '/calendar' });

    // The Calendar's heading is the selected day, which opens on today.
    expect(screen.getByRole('header', { name: formatLongDate(new Date()) })).toBeOnTheScreen();
    expect(screen.getByText('+ New Task')).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Calendar', selected: true })).toBeOnTheScreen();
  });
});
