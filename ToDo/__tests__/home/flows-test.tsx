import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
import { Dimensions } from 'react-native';

import { makeTestRoot } from '../../config/jest/session-helpers';

import SignInScreen from '@/app/sign-in';
import TabsLayout from '@/app/(tabs)/_layout';
import CalendarScreen from '@/app/(tabs)/calendar';
import CategoriesScreen from '@/app/(tabs)/categories';
import HomeScreen from '@/app/(tabs)/index';
import NewTaskScreen from '@/app/task/new';
import StatusScreen from '@/app/status/[status]';
import { RootNavigator } from '@/components/layout/root-navigator';
import { RepositoryError } from '@/repositories/errors';
import { createMemoryRepositories } from '@/repositories/memory/memory-repositories';
import type { Repositories } from '@/repositories/types';
import { endOfDay } from '@/utils/dates';

const USER = 'rune_dev';

function setWindowWidth(width: number) {
  jest.spyOn(Dimensions, 'get').mockReturnValue({ width, height: 900, scale: 1, fontScale: 1 });
}

async function seed(repositories: Repositories) {
  await repositories.users.create(USER);
  const design = await repositories.categories.create(USER, { name: 'Design', description: '', color: '#b7004f' });
  const dev = await repositories.categories.create(USER, { name: 'Development', description: '', color: '#00696b' });
  const today = endOfDay(new Date());
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 9, 0);
  const base = { description: '', priority: 'medium' as const };
  const a = await repositories.tasks.create(USER, { ...base, categoryId: design.id, name: 'Finalize Wireframes', dueAt: today, status: 'in_process' });
  const b = await repositories.tasks.create(USER, { ...base, categoryId: dev.id, name: 'API Schema Review', dueAt: today });
  await repositories.tasks.create(USER, { ...base, categoryId: design.id, name: 'Old Report', dueAt: yesterday });
  return { design, dev, a, b };
}

function render(repositories: Repositories, initialUrl = '/') {
  return renderRouter(
    {
      _layout: makeTestRoot({ repositories, initial: { username: USER, recent: [USER] }, children: () => <RootNavigator /> }),
      'sign-in': SignInScreen,
      '(tabs)/_layout': TabsLayout,
      '(tabs)/index': HomeScreen,
      '(tabs)/calendar': CalendarScreen,
      '(tabs)/categories': CategoriesScreen,
      'task/new': NewTaskScreen,
      'status/[status]': StatusScreen,
    },
    { initialUrl },
  );
}

const press = (name: string | RegExp) => fireEvent.press(screen.getByRole('button', { name }));
const typeInto = (label: string, value: string) => fireEvent.changeText(screen.getByLabelText(label), value);

afterEach(() => jest.restoreAllMocks());

describe('Home', () => {
  it("shows today's tasks and the status counts from the database", async () => {
    setWindowWidth(390);
    const repositories = createMemoryRepositories();
    await seed(repositories);
    render(repositories);

    expect(await screen.findByText('Finalize Wireframes')).toBeOnTheScreen();
    expect(screen.getByText('API Schema Review')).toBeOnTheScreen();
    expect(screen.queryByText('Old Report')).toBeNull();
    expect(screen.getByRole('button', { name: 'Overdue: 1 Tasks' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'In Process: 1 Active' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Pending: 1 Queued' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Completed: 0 Done' })).toBeOnTheScreen();
  });

  it('ticking a task saves it as done and the numbers update live', async () => {
    setWindowWidth(390);
    const repositories = createMemoryRepositories();
    const { a } = await seed(repositories);
    render(repositories);

    const tick = await screen.findByRole('checkbox', { name: 'Mark Finalize Wireframes done' });
    await act(async () => {
      fireEvent.press(tick);
    });

    await waitFor(() => expect(screen.getByRole('button', { name: 'Completed: 1 Done' })).toBeOnTheScreen());
    expect(screen.getByRole('button', { name: 'In Process: 0 Active' })).toBeOnTheScreen();
    expect(screen.getByRole('checkbox', { name: 'Mark Finalize Wireframes not done' })).toBeChecked();
    const saved = await repositories.tasks.get(USER, a.id);
    expect(saved?.status).toBe('done');
    expect(saved?.completedAt).toBeInstanceOf(Date);

    await act(async () => {
      fireEvent.press(screen.getByRole('checkbox', { name: 'Mark Finalize Wireframes not done' }));
    });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Completed: 0 Done' })).toBeOnTheScreen());
    expect((await repositories.tasks.get(USER, a.id))?.status).toBe('pending');
  });

  it('opens the list for a status from its card', async () => {
    setWindowWidth(390);
    const repositories = createMemoryRepositories();
    await seed(repositories);
    render(repositories);

    fireEvent.press(await screen.findByRole('button', { name: 'Overdue: 1 Tasks' }));
    await waitFor(() => expect(screen).toHavePathname('/status/overdue'));
    expect(screen.getByRole('header', { name: 'Overdue' })).toBeOnTheScreen();
  });

  it('with nothing due today offers to add the first task', async () => {
    setWindowWidth(390);
    const repositories = createMemoryRepositories();
    await repositories.users.create(USER);
    render(repositories);

    expect(await screen.findByRole('header', { name: 'Clear Skies Ahead!' })).toBeOnTheScreen();
    press('Add First Task');
    await waitFor(() => expect(screen).toHavePathname('/task/new'));
  });

  it('quick add on desktop creates a task for today in the chosen category', async () => {
    setWindowWidth(1280);
    const repositories = createMemoryRepositories();
    const { dev } = await seed(repositories);
    render(repositories);

    await screen.findAllByText('Finalize Wireframes'); // in the list and in the schedule
    expect(screen.getByRole('button', { name: 'Fast Submit' })).toBeDisabled();
    typeInto('Quick add task name', 'Call the client');
    fireEvent.press(screen.getAllByRole('button', { name: 'Development' }).at(-1)!);
    await act(async () => {
      press('Fast Submit');
    });

    expect((await screen.findAllByText('Call the client')).length).toBeGreaterThan(0);
    const created = (await repositories.tasks.list(USER)).find((t) => t.name === 'Call the client');
    expect(created).toMatchObject({ categoryId: dev.id, priority: 'medium', status: 'pending' });
  });

  it("shows today's schedule on desktop", async () => {
    setWindowWidth(1280);
    const repositories = createMemoryRepositories();
    await seed(repositories);
    render(repositories);
    expect(await screen.findByRole('header', { name: "Today's Schedule" })).toBeOnTheScreen();
  });

  it('shows a message when saving a tick fails, and keeps the task unchanged', async () => {
    setWindowWidth(390);
    const real = createMemoryRepositories();
    await seed(real);
    const repositories: Repositories = {
      ...real,
      tasks: {
        ...real.tasks,
        setStatus: async () => {
          throw new RepositoryError('unavailable', 'offline');
        },
      },
    };
    render(repositories);

    const tick = await screen.findByRole('checkbox', { name: 'Mark Finalize Wireframes done' });
    await act(async () => {
      fireEvent.press(tick);
    });
    expect(await screen.findByText('Could not reach the database. Check your connection and try again.')).toBeOnTheScreen();
    expect(screen.getByRole('checkbox', { name: 'Mark Finalize Wireframes done' })).not.toBeChecked();
  });
});

describe('New task', () => {
  it('creates a task from the form and returns to Home', async () => {
    setWindowWidth(390);
    const repositories = createMemoryRepositories();
    const { dev } = await seed(repositories);
    render(repositories);

    await screen.findByText('Finalize Wireframes');
    fireEvent.press(screen.getByRole('link', { name: 'New task' }));
    await waitFor(() => expect(screen).toHavePathname('/task/new'));

    await screen.findByLabelText('Task Name');
    typeInto('Task Name', 'Write the report');
    press('Development');
    press('Urgent');
    press('Add Subtask');
    typeInto('Subtask 1 name', 'Collect numbers');
    await act(async () => {
      press('Create Task');
    });

    await waitFor(() => expect(screen).toHavePathname('/'));
    const task = (await repositories.tasks.list(USER)).find((t) => t.name === 'Write the report');
    expect(task).toMatchObject({ categoryId: dev.id, priority: 'urgent', subtaskTotal: 1 });
    expect((await repositories.subtasks.list(USER, task!.id)).map((s) => s.name)).toEqual(['Collect numbers']);
  });

  it('keeps the form and explains when the name is missing', async () => {
    setWindowWidth(390);
    const repositories = createMemoryRepositories();
    await seed(repositories);
    render(repositories, '/task/new');

    await screen.findByLabelText('Task Name');
    press('Create Task');
    expect(screen.getByText('Enter a name.')).toBeOnTheScreen();
    expect(screen).toHavePathname('/task/new');
    expect(await repositories.tasks.list(USER)).toHaveLength(3);
  });

  it('can create a category on the spot and uses it for the task', async () => {
    setWindowWidth(390);
    const repositories = createMemoryRepositories();
    await repositories.users.create(USER);
    render(repositories, '/task/new');

    await screen.findByLabelText('Task Name');
    expect(screen.getByText('You have no categories yet. Create one to continue.')).toBeOnTheScreen();
    press('New');
    typeInto('Name', 'Meeting');
    await act(async () => {
      press('Create Category');
    });

    await waitFor(() => expect(screen.getByRole('button', { name: 'Meeting' })).toBeSelected());
    typeInto('Task Name', 'Weekly sync');
    await act(async () => {
      press('Create Task');
    });

    await waitFor(() => expect(screen).toHavePathname('/'));
    const [category] = await repositories.categories.list(USER);
    expect(category.name).toBe('Meeting');
    expect((await repositories.tasks.list(USER))[0]).toMatchObject({ name: 'Weekly sync', categoryId: category.id });
  });

  it('pre-selects a category and a day from the address', async () => {
    setWindowWidth(390);
    const repositories = createMemoryRepositories();
    const { dev } = await seed(repositories);
    render(repositories, `/task/new?categoryId=${dev.id}&date=2026-11-20`);

    await screen.findByLabelText('Task Name');
    expect(screen.getByRole('button', { name: 'Development' })).toBeSelected();
    expect(screen.getByLabelText('Date & Time')).toHaveDisplayValue('2026-11-20 17:00');
  });

  it('shows the error and stays on the form when saving fails', async () => {
    setWindowWidth(390);
    const real = createMemoryRepositories();
    await seed(real);
    const repositories: Repositories = {
      ...real,
      tasks: {
        ...real.tasks,
        create: async () => {
          throw new RepositoryError('permission-denied', 'denied');
        },
      },
    };
    render(repositories, '/task/new');

    await screen.findByLabelText('Task Name');
    typeInto('Task Name', 'Will fail');
    await act(async () => {
      press('Create Task');
    });

    expect(await screen.findByText('The database refused the request. Please try again later.')).toBeOnTheScreen();
    expect(screen).toHavePathname('/task/new');
    expect(screen.getByLabelText('Task Name')).toHaveDisplayValue('Will fail');
  });

  it('Cancel goes back', async () => {
    setWindowWidth(390);
    const repositories = createMemoryRepositories();
    await seed(repositories);
    render(repositories);

    await screen.findByText('Finalize Wireframes');
    fireEvent.press(screen.getByRole('link', { name: 'New task' }));
    await screen.findByLabelText('Task Name');
    press('Cancel');
    await waitFor(() => expect(screen).toHavePathname('/'));
  });
});
