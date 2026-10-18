import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
import { Dimensions } from 'react-native';

import { appRoutes } from '../../config/jest/app-routes';
import { makeTestRoot } from '../../config/jest/session-helpers';

import { RootNavigator } from '@/components/layout/root-navigator';
import type { StatusKey } from '@/domain/types';
import { RepositoryError } from '@/repositories/errors';
import { createMemoryRepositories } from '@/repositories/memory/memory-repositories';
import type { Repositories } from '@/repositories/types';
import { endOfDay } from '@/utils/dates';

const USER = 'rune_dev';

function setWindowWidth(width: number) {
  jest.spyOn(Dimensions, 'get').mockReturnValue({ width, height: 900, scale: 1, fontScale: 1 });
}

/** One category and a task due today with three subtasks (one done), plus an overdue task. */
async function seed(repositories: Repositories) {
  await repositories.users.create(USER);
  const design = await repositories.categories.create(USER, { name: 'Design', description: '', color: '#b7004f' });
  const today = endOfDay(new Date());
  const base = { description: 'Prepare the component hierarchy.', priority: 'high' as const };
  const task = await repositories.tasks.create(USER, { ...base, categoryId: design.id, name: 'Finalize Wireframes', dueAt: today, status: 'in_process' });
  const sub = { description: '', priority: 'medium' as const, dueAt: today };
  const s1 = await repositories.subtasks.create(USER, task.id, { ...sub, name: 'Draft components' });
  const s2 = await repositories.subtasks.create(USER, task.id, { ...sub, name: 'Review contrast' });
  await repositories.subtasks.create(USER, task.id, { ...sub, name: 'Export assets' });
  await repositories.subtasks.setStatus(USER, task.id, s1.id, 'done');
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 9, 0);
  const late = await repositories.tasks.create(USER, { description: '', priority: 'low', categoryId: design.id, name: 'Old Report', dueAt: yesterday });
  return { design, task, s1, s2, late };
}

function render(repositories: Repositories, initialUrl: string, signedIn = true) {
  return renderRouter(
    {
      _layout: makeTestRoot({
        repositories,
        initial: { username: signedIn ? USER : null, recent: [] },
        children: () => <RootNavigator />,
      }),
      ...appRoutes,
    },
    { initialUrl },
  );
}

/** Wraps `tasks`/`subtasks` writes so a test can hold them open and then settle them. */
function withControlledWrites(real: Repositories) {
  const pending: { resolve: () => void; reject: (error: unknown) => void }[] = [];
  const gate = () => new Promise<void>((resolve, reject) => pending.push({ resolve, reject }));
  const repositories: Repositories = {
    ...real,
    tasks: {
      ...real.tasks,
      setStatus: async (u, id, status: StatusKey) => {
        await gate();
        return real.tasks.setStatus(u, id, status);
      },
    },
    subtasks: {
      ...real.subtasks,
      setStatus: async (u, taskId, id, status: StatusKey) => {
        await gate();
        return real.subtasks.setStatus(u, taskId, id, status);
      },
    },
  };
  return { repositories, pending };
}

const press = (name: string | RegExp) => fireEvent.press(screen.getByRole('button', { name }));
const typeInto = (label: string, value: string) => fireEvent.changeText(screen.getByLabelText(label), value);

afterEach(() => jest.restoreAllMocks());
beforeEach(() => setWindowWidth(390));

describe('opening a task', () => {
  it('opens from a Home row and shows its details and subtasks', async () => {
    const repositories = createMemoryRepositories();
    const { task } = await seed(repositories);
    render(repositories, '/');

    fireEvent.press(await screen.findByRole('button', { name: /^Finalize Wireframes,/ }));
    await waitFor(() => expect(screen).toHavePathname(`/task/${task.id}`));

    expect(await screen.findByRole('header', { name: 'Finalize Wireframes' })).toBeOnTheScreen();
    expect(screen.getByText('Prepare the component hierarchy.')).toBeOnTheScreen();
    expect(await screen.findByText('Draft components')).toBeOnTheScreen();
    expect(screen.getByText('33% Completed')).toBeOnTheScreen();
    expect(screen.getByText('1 of 3 Done')).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'In Process' })).toBeSelected();
  });

  it('says when the task does not exist', async () => {
    const repositories = createMemoryRepositories();
    await seed(repositories);
    render(repositories, '/task/missing');
    expect(await screen.findByRole('header', { name: 'Task not found' })).toBeOnTheScreen();
  });

  it('a signed-out visitor cannot open a task address', async () => {
    const repositories = createMemoryRepositories();
    await repositories.users.create(USER);
    render(repositories, '/task/anything', false);
    await waitFor(() => expect(screen).toHavePathname('/sign-in'));
  });
});

describe('subtasks on the task page', () => {
  it('ticking a subtask updates the progress and the saved counters', async () => {
    const repositories = createMemoryRepositories();
    const { task } = await seed(repositories);
    render(repositories, `/task/${task.id}`);

    const tick = await screen.findByRole('checkbox', { name: 'Mark Review contrast done' });
    await act(async () => {
      fireEvent.press(tick);
    });

    await waitFor(() => expect(screen.getByText('2 of 3 Done')).toBeOnTheScreen());
    expect(screen.getByText('67% Completed')).toBeOnTheScreen();
    expect((await repositories.tasks.get(USER, task.id))?.subtaskDone).toBe(2);
  });

  it('finishing the last subtask offers Finish Task, which completes the task', async () => {
    const repositories = createMemoryRepositories();
    const { task } = await seed(repositories);
    render(repositories, `/task/${task.id}`);

    for (const name of ['Review contrast', 'Export assets']) {
      const tick = await screen.findByRole('checkbox', { name: `Mark ${name} done` });
      await act(async () => {
        fireEvent.press(tick);
      });
    }
    expect(await screen.findByText('All subtasks are done. Finish the task?')).toBeOnTheScreen();

    await act(async () => {
      press('Finish Task');
    });
    await waitFor(() => expect(screen.getByText('100% Completed')).toBeOnTheScreen());
    const saved = await repositories.tasks.get(USER, task.id);
    expect(saved?.status).toBe('done');
    expect(saved?.completedAt).toBeInstanceOf(Date);
    expect(screen.getByRole('button', { name: 'Reopen Task' })).toBeOnTheScreen();
  });

  it('the lifecycle selector changes the saved status, and overdue cannot be picked', async () => {
    const repositories = createMemoryRepositories();
    const { late } = await seed(repositories);
    render(repositories, `/task/${late.id}`);

    expect(await screen.findByRole('radio', { name: 'Overdue' })).toBeSelected();
    expect(screen.getByRole('radio', { name: 'Overdue' })).toBeDisabled();
    await act(async () => {
      fireEvent.press(screen.getByRole('radio', { name: 'In Process' }));
    });
    await waitFor(async () => expect((await repositories.tasks.get(USER, late.id))?.status).toBe('in_process'));
    // The deadline has still passed, so the page keeps showing it as overdue.
    expect(screen.getByRole('radio', { name: 'Overdue' })).toBeSelected();
  });

  it('adds a subtask that inherits the category, then returns to the task', async () => {
    const repositories = createMemoryRepositories();
    const { task } = await seed(repositories);
    render(repositories, `/task/${task.id}`);

    await screen.findByText('Draft components');
    press('Add');
    await waitFor(() => expect(screen).toHavePathname(`/task/${task.id}/subtask-new`));
    expect(await screen.findByText('Inherited from parent')).toBeOnTheScreen();

    typeInto('Subtask Name', 'Write the summary');
    await act(async () => {
      press('Add Subtask');
    });

    await waitFor(() => expect(screen).toHavePathname(`/task/${task.id}`));
    expect(await screen.findByText('Write the summary')).toBeOnTheScreen();
    expect(screen.getByText('1 of 4 Done')).toBeOnTheScreen();
    expect((await repositories.tasks.get(USER, task.id))?.subtaskTotal).toBe(4);
  });

  it('edits a subtask', async () => {
    const repositories = createMemoryRepositories();
    const { task, s2 } = await seed(repositories);
    render(repositories, `/task/${task.id}`);

    fireEvent.press(await screen.findByRole('button', { name: /^Review contrast,/ }));
    await waitFor(() => expect(screen).toHavePathname(`/task/${task.id}/subtask/${s2.id}`));
    expect(await screen.findByLabelText('Subtask Name')).toHaveDisplayValue('Review contrast');

    typeInto('Subtask Name', 'Review colour contrast');
    await act(async () => {
      press('Save Subtask');
    });
    await waitFor(() => expect(screen).toHavePathname(`/task/${task.id}`));
    expect(await screen.findByText('Review colour contrast')).toBeOnTheScreen();
  });

  it('deletes a subtask only after confirming, and updates the counters', async () => {
    const repositories = createMemoryRepositories();
    const { task, s1 } = await seed(repositories);
    render(repositories, `/task/${task.id}/subtask/${s1.id}`);

    await screen.findByLabelText('Subtask Name');
    press('Delete Subtask');
    expect(await screen.findByText('"Draft components" will be deleted. This cannot be undone.')).toBeOnTheScreen();

    fireEvent.press(screen.getAllByRole('button', { name: 'Cancel' }).at(-1)!); // the dialog's, not the form's
    expect(await repositories.subtasks.list(USER, task.id)).toHaveLength(3);

    press('Delete Subtask');
    await act(async () => {
      fireEvent.press(screen.getAllByRole('button', { name: 'Delete Subtask' }).at(-1)!);
    });
    await waitFor(async () => expect(await repositories.subtasks.list(USER, task.id)).toHaveLength(2));
    expect(await repositories.tasks.get(USER, task.id)).toMatchObject({ subtaskTotal: 2, subtaskDone: 0 });
  });
});

describe('a subtask is never due after its task', () => {
  it('adding a subtask due after the task shows the reason and saves nothing', async () => {
    const repositories = createMemoryRepositories();
    const { task } = await seed(repositories);
    render(repositories, `/task/${task.id}/subtask-new`);

    await screen.findByLabelText('Subtask Name');
    typeInto('Subtask Name', 'Too late');
    // The task is due at 23:59 today; the form is for a day later.
    const tomorrow = new Date(task.dueAt.getFullYear(), task.dueAt.getMonth(), task.dueAt.getDate() + 1, 9, 0);
    const text = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')} 09:00`;
    typeInto('Due Date & Time', text);
    await act(async () => {
      press('Add Subtask');
    });

    expect(screen.getByText(/Must not be after the task's due time/)).toBeOnTheScreen();
    expect(screen).toHavePathname(`/task/${task.id}/subtask-new`);
    expect(await repositories.subtasks.list(USER, task.id)).toHaveLength(3);
  });

  it('moving the task earlier moves its later subtasks with it', async () => {
    const repositories = createMemoryRepositories();
    const { task } = await seed(repositories);
    render(repositories, `/task/${task.id}/edit`);

    await screen.findByLabelText('Task Name');
    expect(screen.getByText('Subtasks due later than this move to the new due time.')).toBeOnTheScreen();
    const day = task.dueAt;
    const early = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 10, 0);
    const text = `${early.getFullYear()}-${String(early.getMonth() + 1).padStart(2, '0')}-${String(early.getDate()).padStart(2, '0')} 10:00`;
    typeInto('Date & Time', text);
    await act(async () => {
      press('Save Changes');
    });

    await waitFor(() => expect(screen).not.toHavePathname(`/task/${task.id}/edit`));
    expect((await repositories.tasks.get(USER, task.id))?.dueAt).toEqual(early);
    const subtasks = await repositories.subtasks.list(USER, task.id);
    expect(subtasks.map((s) => s.dueAt.getTime())).toEqual([early.getTime(), early.getTime(), early.getTime()]);
  });
});

describe('editing and deleting a task', () => {
  it('edits the task and shows the change on the task page', async () => {
    const repositories = createMemoryRepositories();
    const { task } = await seed(repositories);
    render(repositories, `/task/${task.id}`);

    await screen.findByText('Draft components');
    press('Task options');
    press('Edit Task');
    await waitFor(() => expect(screen).toHavePathname(`/task/${task.id}/edit`));

    expect(await screen.findByLabelText('Task Name')).toHaveDisplayValue('Finalize Wireframes');
    typeInto('Task Name', 'Finalize Homepage Wireframes');
    press('Urgent');
    await act(async () => {
      press('Save Changes');
    });

    await waitFor(() => expect(screen).toHavePathname(`/task/${task.id}`));
    expect(await screen.findByRole('header', { name: 'Finalize Homepage Wireframes' })).toBeOnTheScreen();
    expect(await repositories.tasks.get(USER, task.id)).toMatchObject({ name: 'Finalize Homepage Wireframes', priority: 'urgent' });
    // Status and subtasks are untouched by an edit.
    expect(await repositories.subtasks.list(USER, task.id)).toHaveLength(3);
  });

  it('deletes the task and its subtasks only after confirming', async () => {
    const repositories = createMemoryRepositories();
    const { task } = await seed(repositories);
    render(repositories, '/');

    fireEvent.press(await screen.findByRole('button', { name: /^Finalize Wireframes,/ }));
    await screen.findByText('Draft components');
    press('Task options');
    press('Delete Task');
    expect(await screen.findByText(/"Finalize Wireframes" and all of its subtasks will be deleted/)).toBeOnTheScreen();

    press('Cancel');
    expect(await repositories.tasks.get(USER, task.id)).not.toBeNull();

    press('Task options');
    press('Delete Task');
    await act(async () => {
      fireEvent.press(screen.getAllByRole('button', { name: 'Delete Task' }).at(-1)!);
    });

    await waitFor(() => expect(screen).toHavePathname('/'));
    expect(await repositories.tasks.get(USER, task.id)).toBeNull();
    expect(await repositories.subtasks.list(USER, task.id)).toEqual([]);
  });
});

describe('status lists', () => {
  it('opens from a Home card and lists the tasks in that state', async () => {
    const repositories = createMemoryRepositories();
    await seed(repositories);
    render(repositories, '/');

    fireEvent.press(await screen.findByRole('button', { name: 'Overdue: 1 Tasks' }));
    await waitFor(() => expect(screen).toHavePathname('/status/overdue'));
    expect(await screen.findByText('Old Report')).toBeOnTheScreen();
    expect(screen.getByText('1 Task')).toBeOnTheScreen();
    expect(screen.queryByText('Finalize Wireframes')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Add Task to Status' })).toBeNull();
  });

  it('ticking a task removes it from the list at once', async () => {
    const repositories = createMemoryRepositories();
    const { task } = await seed(repositories);
    render(repositories, '/status/in_process');

    const tick = await screen.findByRole('checkbox', { name: 'Mark Finalize Wireframes done' });
    await act(async () => {
      fireEvent.press(tick);
    });
    await waitFor(() => expect(screen.queryByText('Finalize Wireframes')).toBeNull());
    expect(screen.getByText('No in process tasks right now.')).toBeOnTheScreen();
    expect((await repositories.tasks.get(USER, task.id))?.status).toBe('done');
  });

  it('"Add Task to Status" creates a task that starts in that status', async () => {
    const repositories = createMemoryRepositories();
    await seed(repositories);
    render(repositories, '/status/in_process');

    await screen.findByText('Finalize Wireframes');
    press('Add Task to Status');
    await waitFor(() => expect(screen).toHavePathname('/task/new'));
    await screen.findByLabelText('Task Name');
    typeInto('Task Name', 'Already started');
    await act(async () => {
      press('Create Task');
    });

    await waitFor(() => expect(screen).toHavePathname('/status/in_process'));
    const created = (await repositories.tasks.list(USER)).find((t) => t.name === 'Already started');
    expect(created?.status).toBe('in_process');
  });

  it('says there is no such status for a bad address', async () => {
    const repositories = createMemoryRepositories();
    await seed(repositories);
    render(repositories, '/status/bogus');
    expect(await screen.findByRole('header', { name: 'Not found' })).toBeOnTheScreen();
  });
});

describe('optimistic ticks', () => {
  it('Home: the tick shows at once, before the save finishes', async () => {
    const real = createMemoryRepositories();
    await seed(real);
    const { repositories, pending } = withControlledWrites(real);
    render(repositories, '/');

    const tick = await screen.findByRole('checkbox', { name: 'Mark Finalize Wireframes done' });
    await act(async () => {
      fireEvent.press(tick);
    });

    // The save is still waiting, yet the screen already shows the new state and numbers.
    expect(pending).toHaveLength(1);
    expect(screen.getByRole('checkbox', { name: 'Mark Finalize Wireframes not done' })).toBeChecked();
    expect(screen.getByRole('button', { name: 'Completed: 1 Done' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'In Process: 0 Active' })).toBeOnTheScreen();

    await act(async () => pending[0].resolve());
    await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Mark Finalize Wireframes not done' })).toBeChecked());
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('Home: if the save fails the old state comes back with a message', async () => {
    const real = createMemoryRepositories();
    await seed(real);
    const { repositories, pending } = withControlledWrites(real);
    render(repositories, '/');

    const tick = await screen.findByRole('checkbox', { name: 'Mark Finalize Wireframes done' });
    await act(async () => {
      fireEvent.press(tick);
    });
    expect(screen.getByRole('checkbox', { name: 'Mark Finalize Wireframes not done' })).toBeChecked();

    await act(async () => pending[0].reject(new RepositoryError('unavailable', 'offline')));

    await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Mark Finalize Wireframes done' })).not.toBeChecked());
    expect(screen.getByRole('button', { name: 'In Process: 1 Active' })).toBeOnTheScreen();
    expect(screen.getByRole('alert')).toHaveTextContent(/Could not reach the database/);
  });

  it('task page: a subtask tick and its progress show at once, and revert on failure', async () => {
    const real = createMemoryRepositories();
    const { task } = await seed(real);
    const { repositories, pending } = withControlledWrites(real);
    render(repositories, `/task/${task.id}`);

    const tick = await screen.findByRole('checkbox', { name: 'Mark Review contrast done' });
    await act(async () => {
      fireEvent.press(tick);
    });
    expect(screen.getByRole('checkbox', { name: 'Mark Review contrast not done' })).toBeChecked();
    expect(screen.getByText('2 of 3 Done')).toBeOnTheScreen();

    await act(async () => pending[0].reject(new RepositoryError('permission-denied', 'no')));
    await waitFor(() => expect(screen.getByText('1 of 3 Done')).toBeOnTheScreen());
    expect(screen.getByRole('checkbox', { name: 'Mark Review contrast done' })).not.toBeChecked();
    expect(screen.getByRole('alert')).toHaveTextContent(/The database refused the request/);
  });

  it('task page: Finish Task shows the finished state at once', async () => {
    const real = createMemoryRepositories();
    const { task } = await seed(real);
    const { repositories, pending } = withControlledWrites(real);
    render(repositories, `/task/${task.id}`);

    await screen.findByText('Draft components');
    await act(async () => {
      press('Finish Task');
    });
    expect(screen.getByText('100% Completed')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Reopen Task' })).toBeOnTheScreen();
    await act(async () => pending[0].resolve());
  });
});
