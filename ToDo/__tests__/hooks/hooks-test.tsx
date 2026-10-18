import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { SessionHarness } from '../../config/jest/session-helpers';

import { useCategories } from '@/hooks/use-categories';
import { useTaskActions } from '@/hooks/use-task-actions';
import { useTasks } from '@/hooks/use-tasks';
import { RepositoryError } from '@/repositories/errors';
import { createMemoryRepositories } from '@/repositories/memory/memory-repositories';
import type { Repositories } from '@/repositories/types';

const due = new Date(2026, 9, 18, 17, 0);
const input = (categoryId: string, name = 'Task') => ({ categoryId, name, description: '', priority: 'medium' as const, dueAt: due });

async function setup() {
  const repositories = createMemoryRepositories();
  await repositories.users.create('rune_dev');
  const category = await repositories.categories.create('rune_dev', { name: 'Design', description: '', color: '#b7004f' });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <SessionHarness repositories={repositories} initial={{ username: 'rune_dev', recent: [] }}>
      {children}
    </SessionHarness>
  );
  return { repositories, category, wrapper };
}

describe('useTasks and useCategories', () => {
  it('start loading, then deliver the current list', async () => {
    const { repositories, category, wrapper } = await setup();
    await repositories.tasks.create('rune_dev', input(category.id, 'Existing'));

    const tasks = renderHook(() => useTasks(), { wrapper });
    const categories = renderHook(() => useCategories(), { wrapper });
    expect(tasks.result.current.loading).toBe(true);
    expect(tasks.result.current.data).toBeUndefined();

    await waitFor(() => expect(tasks.result.current.loading).toBe(false));
    expect(tasks.result.current.data?.map((t) => t.name)).toEqual(['Existing']);
    await waitFor(() => expect(categories.result.current.data?.map((c) => c.name)).toEqual(['Design']));
  });

  it('update live when something is added elsewhere', async () => {
    const { repositories, category, wrapper } = await setup();
    const { result } = renderHook(() => useTasks(), { wrapper });
    await waitFor(() => expect(result.current.data).toEqual([]));

    await act(async () => {
      await repositories.tasks.create('rune_dev', input(category.id, 'Added later'));
    });
    await waitFor(() => expect(result.current.data?.map((t) => t.name)).toEqual(['Added later']));
  });

  it('report a failed subscription as an error, not as endless loading', async () => {
    const real = createMemoryRepositories();
    await real.users.create('rune_dev');
    const failing: Repositories = {
      ...real,
      tasks: {
        ...real.tasks,
        subscribe: (_username, _onData, onError) => {
          queueMicrotask(() => onError?.(new RepositoryError('unavailable', 'offline')));
          return () => {};
        },
      },
    };
    const wrapper = ({ children }: { children: ReactNode }) => (
      <SessionHarness repositories={failing} initial={{ username: 'rune_dev', recent: [] }}>
        {children}
      </SessionHarness>
    );
    const { result } = renderHook(() => useTasks(), { wrapper });
    await waitFor(() => expect(result.current.error?.code).toBe('unavailable'));
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('stop listening when unmounted', async () => {
    const real = createMemoryRepositories();
    await real.users.create('rune_dev');
    const unsubscribe = jest.fn();
    const repositories: Repositories = {
      ...real,
      tasks: { ...real.tasks, subscribe: () => unsubscribe },
    };
    const wrapper = ({ children }: { children: ReactNode }) => (
      <SessionHarness repositories={repositories} initial={{ username: 'rune_dev', recent: [] }}>
        {children}
      </SessionHarness>
    );
    const { unmount } = renderHook(() => useTasks(), { wrapper });
    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});

describe('useTaskActions', () => {
  it('creates a task together with its subtasks and updates the counters', async () => {
    const { repositories, category, wrapper } = await setup();
    const { result } = renderHook(() => useTaskActions(), { wrapper });

    let created;
    await act(async () => {
      created = await result.current.createTask({
        task: input(category.id, 'Parent'),
        subtasks: [
          { name: 'One', description: '', priority: 'medium', dueAt: due },
          { name: 'Two', description: '', priority: 'medium', dueAt: due },
        ],
      });
    });

    expect(created).toMatchObject({ name: 'Parent' });
    const [task] = await repositories.tasks.list('rune_dev');
    expect(task).toMatchObject({ name: 'Parent', subtaskTotal: 2 });
    expect((await repositories.subtasks.list('rune_dev', task.id)).map((s) => s.name)).toEqual(['One', 'Two']);
  });

  it('tells the person when the task was saved but a subtask was not', async () => {
    const { repositories, category, wrapper } = await setup();
    const failing: Repositories = {
      ...repositories,
      subtasks: {
        ...repositories.subtasks,
        create: async () => {
          throw new RepositoryError('unavailable', 'offline');
        },
      },
    };
    const failingWrapper = ({ children }: { children: ReactNode }) => (
      <SessionHarness repositories={failing} initial={{ username: 'rune_dev', recent: [] }}>
        {children}
      </SessionHarness>
    );
    void wrapper;
    const { result } = renderHook(() => useTaskActions(), { wrapper: failingWrapper });

    await expect(
      result.current.createTask({
        task: input(category.id, 'Parent'),
        subtasks: [{ name: 'One', description: '', priority: 'medium', dueAt: due }],
      }),
    ).rejects.toThrow('The task was saved, but a subtask was not: Could not reach the database.');
    expect(await repositories.tasks.list('rune_dev')).toHaveLength(1);
  });

  it('sets a task status and creates a category', async () => {
    const { repositories, category, wrapper } = await setup();
    const { result } = renderHook(() => useTaskActions(), { wrapper });
    const task = await repositories.tasks.create('rune_dev', input(category.id));

    await act(async () => {
      await result.current.setTaskStatus(task.id, 'done');
    });
    expect((await repositories.tasks.get('rune_dev', task.id))?.status).toBe('done');

    let created;
    await act(async () => {
      created = await result.current.createCategory({ name: 'Meeting', description: '', color: '#795600' });
    });
    expect(created).toMatchObject({ name: 'Meeting' });
  });
});
