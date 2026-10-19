import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
import { Dimensions } from 'react-native';

import { appRoutes } from '../../config/jest/app-routes';
import { makeTestRoot } from '../../config/jest/session-helpers';

import { RootNavigator } from '@/components/layout/root-navigator';
import { createMemoryRepositories } from '@/repositories/memory/memory-repositories';
import type { Repositories } from '@/repositories/types';
import { addDays, toDayKey } from '@/utils/dates';

const USER = 'rune_dev';

function setWindowWidth(width: number) {
  jest.spyOn(Dimensions, 'get').mockReturnValue({ width, height: 900, scale: 1, fontScale: 1 });
}

/** Another day of the same Monday-first week as today: tomorrow, except on a Sunday (the week's last day) when it is yesterday. */
const NEIGHBOUR = new Date().getDay() === 0 ? -1 : 1;

/** The screen reads the real clock, so tasks are placed relative to the real "today". */
function day(offset: number, hours: number, minutes = 0) {
  const base = addDays(new Date(), offset);
  return new Date(base.getFullYear(), base.getMonth(), base.getDate(), hours, minutes);
}

async function seed(repositories: Repositories) {
  await repositories.users.create(USER);
  const design = await repositories.categories.create(USER, { name: 'Design', description: '', color: '#b7004f' });
  const dev = await repositories.categories.create(USER, { name: 'Development', description: '', color: '#00696b' });
  const base = { description: '', priority: 'medium' as const };
  const morning = await repositories.tasks.create(USER, { ...base, categoryId: design.id, name: 'Morning review', startAt: day(0, 9), dueAt: day(0, 10) });
  const late = await repositories.tasks.create(USER, { ...base, categoryId: dev.id, name: 'Late night deploy', dueAt: day(0, 23, 30) });
  const neighbour = await repositories.tasks.create(USER, { ...base, categoryId: dev.id, name: 'Neighbour planning', dueAt: day(NEIGHBOUR, 9) });
  return { design, dev, morning, late, neighbour };
}

function render(repositories: Repositories, initialUrl = '/calendar') {
  return renderRouter(
    {
      _layout: makeTestRoot({ repositories, initial: { username: USER, recent: [USER] }, children: () => <RootNavigator /> }),
      ...appRoutes,
    },
    { initialUrl },
  );
}

beforeEach(() => setWindowWidth(390));
afterEach(() => jest.restoreAllMocks());

describe('Calendar tab', () => {
  it('shows today’s tasks only, each on its own day, and the neighbouring day’s after selecting it', async () => {
    const repositories = createMemoryRepositories();
    await seed(repositories);
    render(repositories);

    expect(await screen.findByText('Morning review')).toBeOnTheScreen();
    expect(screen.getByText('Late night deploy')).toBeOnTheScreen(); // 23:30 stays on today
    expect(screen.queryByText('Neighbour planning')).toBeNull();

    fireEvent.press(screen.getByRole('button', { name: new RegExp(`^${weekdayLabel(NEIGHBOUR)}`) }));
    expect(await screen.findByText('Neighbour planning')).toBeOnTheScreen();
    expect(screen.queryByText('Morning review')).toBeNull();
    expect(screen.queryByText('Late night deploy')).toBeNull();
  });

  it('shows the empty state on a day with no tasks', async () => {
    const repositories = createMemoryRepositories();
    await seed(repositories);
    render(repositories);

    await screen.findByText('Morning review');
    fireEvent.press(screen.getByRole('button', { name: 'Next week' }));
    expect(await screen.findByRole('header', { name: 'Nothing on the Agenda' })).toBeOnTheScreen();
  });

  it('opens a task from its block', async () => {
    const repositories = createMemoryRepositories();
    const { morning } = await seed(repositories);
    render(repositories);

    fireEvent.press(await screen.findByRole('button', { name: /^Morning review, / }));
    await waitFor(() => expect(screen).toHavePathname(`/task/${morning.id}`));
  });

  it('"Schedule a Task" opens the new-task form for the selected day', async () => {
    const repositories = createMemoryRepositories();
    await seed(repositories);
    render(repositories);

    await screen.findByText('Morning review');
    fireEvent.press(screen.getByRole('button', { name: 'Next week' }));
    fireEvent.press(await screen.findByRole('button', { name: 'Schedule a Task' }));

    await waitFor(() => expect(screen).toHavePathname('/task/new'));
    expect(screen).toHaveSearchParams({ date: toDayKey(day(7, 12)) });
  });

  it('a task created for a day shows on that day when coming back', async () => {
    const repositories = createMemoryRepositories();
    const { design } = await seed(repositories);
    render(repositories);

    await screen.findByText('Morning review');
    await act(async () => {
      await repositories.tasks.create(USER, {
        categoryId: design.id,
        name: 'Added later',
        description: '',
        priority: 'low',
        dueAt: day(0, 15),
      });
    });
    expect(await screen.findByText('Added later')).toBeOnTheScreen();
  });

  it('is only reachable when signed in', async () => {
    const repositories = createMemoryRepositories();
    await seed(repositories);
    renderRouter(
      {
        _layout: makeTestRoot({ repositories, initial: { username: null, recent: [] }, children: () => <RootNavigator /> }),
        ...appRoutes,
      },
      { initialUrl: '/calendar' },
    );
    await waitFor(() => expect(screen).toHavePathname('/sign-in'));
  });
});

describe('Calendar on desktop', () => {
  it('Fast Book opens the new-task form with the selected day', async () => {
    setWindowWidth(1280);
    const repositories = createMemoryRepositories();
    await seed(repositories);
    render(repositories);

    await screen.findByText('Morning review');
    fireEvent.press(screen.getByRole('button', { name: 'Fast Book' }));
    await waitFor(() => expect(screen).toHavePathname('/task/new'));
    expect(screen).toHaveSearchParams({ date: toDayKey(day(0, 12)) });
  });

  it('"Add new subtask…" opens the subtask form of that task', async () => {
    setWindowWidth(1280);
    const repositories = createMemoryRepositories();
    const { late } = await seed(repositories);
    render(repositories);

    await screen.findByText('Late night deploy');
    fireEvent.press(screen.getByRole('button', { name: 'Add subtask to Late night deploy' }));
    await waitFor(() => expect(screen).toHavePathname(`/task/${late.id}/subtask-new`));
  });

  it('the category filter counts the day’s tasks and hides a category', async () => {
    setWindowWidth(1280);
    const repositories = createMemoryRepositories();
    await seed(repositories);
    render(repositories);

    await screen.findByText('Morning review');
    expect(screen.getByRole('checkbox', { name: 'Design, 1 task' })).toBeChecked();
    fireEvent.press(screen.getByRole('checkbox', { name: 'Development, 1 task' }));
    expect(screen.queryByText('Late night deploy')).toBeNull();
    expect(screen.getByText('Morning review')).toBeOnTheScreen();
  });
});

/** "Tue, Oct 20"-style start of a day button's label, for the day `offset` days from today. */
function weekdayLabel(offset: number) {
  const target = day(offset, 12);
  const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${names[target.getDay()]}, ${months[target.getMonth()]} ${target.getDate()}`;
}
