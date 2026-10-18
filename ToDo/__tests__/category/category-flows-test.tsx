import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
import { Dimensions } from 'react-native';

import { appRoutes } from '../../config/jest/app-routes';
import { makeTestRoot } from '../../config/jest/session-helpers';

import { RootNavigator } from '@/components/layout/root-navigator';
import { RepositoryError } from '@/repositories/errors';
import { createMemoryRepositories } from '@/repositories/memory/memory-repositories';
import type { Repositories } from '@/repositories/types';
import { endOfDay } from '@/utils/dates';

const USER = 'rune_dev';

function setWindowWidth(width: number) {
  jest.spyOn(Dimensions, 'get').mockReturnValue({ width, height: 900, scale: 1, fontScale: 1 });
}

/** Design has three tasks (one done, one overdue); Meeting has none. */
async function seed(repositories: Repositories) {
  await repositories.users.create(USER);
  const design = await repositories.categories.create(USER, { name: 'Design', description: 'Wireframes and UI kits', color: '#b7004f' });
  const meeting = await repositories.categories.create(USER, { name: 'Meeting', description: 'Syncs', color: '#795600' });
  const today = endOfDay(new Date());
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 9, 0);
  const base = { description: '', priority: 'medium' as const, categoryId: design.id };
  const a = await repositories.tasks.create(USER, { ...base, name: 'Wireframes', dueAt: today, status: 'done' });
  const b = await repositories.tasks.create(USER, { ...base, name: 'UI Kit', dueAt: today, status: 'in_process' });
  const c = await repositories.tasks.create(USER, { ...base, name: 'Old Report', dueAt: yesterday });
  return { design, meeting, a, b, c };
}

function render(repositories: Repositories, initialUrl: string) {
  return renderRouter(
    {
      _layout: makeTestRoot({ repositories, initial: { username: USER, recent: [USER] }, children: () => <RootNavigator /> }),
      ...appRoutes,
    },
    { initialUrl },
  );
}

const press = (name: string | RegExp) => fireEvent.press(screen.getByRole('button', { name }));
const typeInto = (label: string, value: string) => fireEvent.changeText(screen.getByLabelText(label), value);

beforeEach(() => setWindowWidth(390));
afterEach(() => jest.restoreAllMocks());

describe('Categories tab', () => {
  it('lists the categories with their task counts and opens one', async () => {
    const repositories = createMemoryRepositories();
    const { design } = await seed(repositories);
    render(repositories, '/categories');

    expect(await screen.findByText('2 categories • 3 tasks')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Meeting, 0 Tasks' })).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: 'Design, 3 Tasks' }));

    await waitFor(() => expect(screen).toHavePathname(`/category/${design.id}`));
    expect(await screen.findByRole('header', { name: 'Design' })).toBeOnTheScreen();
    expect(screen.getByText('Wireframes and UI kits')).toBeOnTheScreen();
    expect(screen.getByText('33%')).toBeOnTheScreen();
  });

  it('creates a category from the New Category card and shows it in the grid', async () => {
    const repositories = createMemoryRepositories();
    await seed(repositories);
    render(repositories, '/categories');

    await screen.findByText('2 categories • 3 tasks');
    press('New Category');
    typeInto('Name', 'Personal');
    await act(async () => {
      press('Create Category');
    });

    expect(await screen.findByRole('button', { name: 'Personal, 0 Tasks' })).toBeOnTheScreen();
    expect(screen.getByText('3 categories • 3 tasks')).toBeOnTheScreen();
    expect((await repositories.categories.list(USER)).map((c) => c.name)).toEqual(['Design', 'Meeting', 'Personal']);
  });

  it('with none, a suggested starter creates it in one tap', async () => {
    const repositories = createMemoryRepositories();
    await repositories.users.create(USER);
    render(repositories, '/categories');

    expect(await screen.findByRole('header', { name: 'Organize Your Universe' })).toBeOnTheScreen();
    await act(async () => {
      press('Design');
    });

    expect(await screen.findByRole('button', { name: 'Design, 0 Tasks' })).toBeOnTheScreen();
    expect((await repositories.categories.list(USER)).map((c) => c.name)).toEqual(['Design']);
  });

  it('explains when a category could not be saved', async () => {
    const real = createMemoryRepositories();
    await seed(real);
    const repositories: Repositories = {
      ...real,
      categories: {
        ...real.categories,
        create: async () => {
          throw new RepositoryError('unavailable', 'offline');
        },
      },
    };
    render(repositories, '/categories');

    await screen.findByText('2 categories • 3 tasks');
    press('New Category');
    typeInto('Name', 'Personal');
    await act(async () => {
      press('Create Category');
    });
    expect((await screen.findAllByText('Could not reach the database. Check your connection and try again.')).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Create Category' })).toBeOnTheScreen(); // the sheet stays open
  });
});

describe('Category page', () => {
  it('shows the numbers, ticking a task updates them at once, and tasks open', async () => {
    const repositories = createMemoryRepositories();
    const { design, b } = await seed(repositories);
    render(repositories, `/category/${design.id}`);

    expect(await screen.findByText('33%')).toBeOnTheScreen();
    const tick = await screen.findByRole('checkbox', { name: 'Mark UI Kit done' });
    await act(async () => {
      fireEvent.press(tick);
    });
    await waitFor(() => expect(screen.getByText('67%')).toBeOnTheScreen());
    expect((await repositories.tasks.get(USER, b.id))?.status).toBe('done');

    fireEvent.press(screen.getByRole('button', { name: /^UI Kit,/ }));
    await waitFor(() => expect(screen).toHavePathname(`/task/${b.id}`));
  });

  it('"Add Task to Category" opens the form with that category chosen, and saving returns here', async () => {
    const repositories = createMemoryRepositories();
    const { meeting } = await seed(repositories);
    render(repositories, `/category/${meeting.id}`);

    await screen.findByText('No tasks in this category yet.');
    press('Add Task to Category');
    await waitFor(() => expect(screen).toHavePathname('/task/new'));
    await screen.findByLabelText('Task Name');
    expect(screen.getByRole('button', { name: 'Meeting' })).toBeSelected();

    typeInto('Task Name', 'Weekly sync');
    await act(async () => {
      press('Create Task');
    });

    await waitFor(() => expect(screen).toHavePathname(`/category/${meeting.id}`));
    expect(await screen.findByRole('button', { name: /^Weekly sync,/ })).toBeOnTheScreen();
    expect((await repositories.tasks.list(USER)).find((t) => t.name === 'Weekly sync')?.categoryId).toBe(meeting.id);
  });

  it('edits the category name, description and colour', async () => {
    const repositories = createMemoryRepositories();
    const { design } = await seed(repositories);
    render(repositories, `/category/${design.id}`);

    await screen.findByText('Wireframes and UI kits');
    press('Category options');
    press('Edit Category');
    expect(await screen.findByLabelText('Name')).toHaveDisplayValue('Design');

    typeInto('Name', 'Design Systems');
    typeInto('Description', 'Tokens and components');
    fireEvent.press(screen.getByRole('radio', { name: 'Colour #00696b' }));
    await act(async () => {
      press('Save Changes');
    });

    expect(await screen.findByRole('header', { name: 'Design Systems' })).toBeOnTheScreen();
    expect(screen.getByText('Tokens and components')).toBeOnTheScreen();
    expect(await repositories.categories.get(USER, design.id)).toMatchObject({
      name: 'Design Systems',
      description: 'Tokens and components',
      color: '#00696b',
    });
  });

  it('deletes an empty category only after confirming', async () => {
    const repositories = createMemoryRepositories();
    const { meeting } = await seed(repositories);
    render(repositories, '/categories');

    fireEvent.press(await screen.findByRole('button', { name: 'Meeting, 0 Tasks' }));
    await screen.findByText('No tasks in this category yet.');
    press('Category options');
    press('Delete Category');
    expect(await screen.findByText('"Meeting" will be deleted. This cannot be undone.')).toBeOnTheScreen();

    press('Cancel');
    expect(await repositories.categories.get(USER, meeting.id)).not.toBeNull();

    press('Category options');
    press('Delete Category');
    await act(async () => {
      fireEvent.press(screen.getAllByRole('button', { name: 'Delete Category' }).at(-1)!);
    });

    await waitFor(() => expect(screen).toHavePathname('/categories'));
    expect(await repositories.categories.get(USER, meeting.id)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Meeting, 0 Tasks' })).toBeNull();
  });

  it('does not offer to delete a category that still has tasks, and says why', async () => {
    const repositories = createMemoryRepositories();
    const { design } = await seed(repositories);
    render(repositories, `/category/${design.id}`);

    await screen.findByText('Wireframes and UI kits');
    press('Category options');
    expect(screen.getByText('This category has 3 tasks. Move or delete them before deleting the category.')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Delete Category' })).toBeNull();
    // The data layer refuses too, in case the page was stale.
    await expect(repositories.categories.remove(USER, design.id)).rejects.toMatchObject({ code: 'category-in-use' });
  });

  it('says when the category does not exist', async () => {
    const repositories = createMemoryRepositories();
    await seed(repositories);
    render(repositories, '/category/missing');
    expect(await screen.findByRole('header', { name: 'Category not found' })).toBeOnTheScreen();
  });
});

describe('Categories on desktop', () => {
  it('shows progress on the cards and filters by the search box', async () => {
    setWindowWidth(1280);
    const repositories = createMemoryRepositories();
    await seed(repositories);
    render(repositories, '/categories');

    expect(await screen.findByText('1 / 3 Done')).toBeOnTheScreen();
    fireEvent.changeText(screen.getByLabelText('Search categories'), 'sync');
    expect(screen.queryByRole('button', { name: 'Design, 3 Tasks' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Meeting, 0 Tasks' })).toBeOnTheScreen();
  });
});
