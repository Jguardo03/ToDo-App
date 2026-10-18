import { act, renderHook } from '@testing-library/react-native';

import { makeTask } from '../../config/jest/factories';

import type { StatusKey, Task } from '@/domain/types';
import { useOptimisticStatus } from '@/hooks/use-optimistic-status';
import { RepositoryError } from '@/repositories/errors';

/** A commit function the test controls: each call waits until the test settles it. */
function controlledCommit() {
  const calls: { id: string; status: StatusKey; resolve: () => void; reject: (error: unknown) => void }[] = [];
  const commit = jest.fn(
    (id: string, status: StatusKey) =>
      new Promise<void>((resolve, reject) => {
        calls.push({ id, status, resolve, reject });
      }),
  );
  return { commit, calls };
}

const a = makeTask({ id: 'a', name: 'A', status: 'pending' });
const b = makeTask({ id: 'b', name: 'B', status: 'in_process' });
const statuses = (items: Task[] | undefined) => items?.map((t) => `${t.id}:${t.status}`);

describe('useOptimisticStatus', () => {
  it('shows the new status immediately, before the save finishes, and marks the item as saving', () => {
    const { commit } = controlledCommit();
    const { result } = renderHook(() => useOptimisticStatus([a, b], commit));

    act(() => {
      void result.current.setStatus(a, 'done');
    });

    expect(statuses(result.current.items)).toEqual(['a:done', 'b:in_process']);
    expect(result.current.items?.[0].completedAt).toBeInstanceOf(Date);
    expect(result.current.savingIds.has('a')).toBe(true);
    expect(commit).toHaveBeenCalledWith('a', 'done');
  });

  it('keeps the change after a successful save, once the list agrees', async () => {
    const { commit, calls } = controlledCommit();
    const { result, rerender } = renderHook(({ items }: { items: Task[] }) => useOptimisticStatus(items, commit), {
      initialProps: { items: [a, b] },
    });

    act(() => {
      void result.current.setStatus(a, 'done');
    });
    // The live list updates first (a local write is reflected at once), then the save is confirmed.
    rerender({ items: [{ ...a, status: 'done' }, b] });
    await act(async () => calls[0].resolve());

    expect(statuses(result.current.items)).toEqual(['a:done', 'b:in_process']);
    expect(result.current.savingIds.size).toBe(0);
    expect(result.current.error).toBeUndefined();
  });

  it('puts the old status back and explains when the save fails', async () => {
    const { commit, calls } = controlledCommit();
    const { result } = renderHook(() => useOptimisticStatus([a, b], commit));

    act(() => {
      void result.current.setStatus(a, 'done');
    });
    expect(statuses(result.current.items)?.[0]).toBe('a:done');

    await act(async () => calls[0].reject(new RepositoryError('unavailable', 'offline')));

    expect(statuses(result.current.items)).toEqual(['a:pending', 'b:in_process']);
    expect(result.current.error).toBe('Could not reach the database. Check your connection and try again.');
    expect(result.current.savingIds.size).toBe(0);
  });

  it('clears the error when asked and when a new change starts', async () => {
    const { commit, calls } = controlledCommit();
    const { result } = renderHook(() => useOptimisticStatus([a, b], commit));

    act(() => {
      void result.current.setStatus(a, 'done');
    });
    await act(async () => calls[0].reject(new Error('x')));
    expect(result.current.error).toBe('Something went wrong. Please try again.');

    act(() => result.current.clearError());
    expect(result.current.error).toBeUndefined();

    await act(async () => calls[0].reject(new Error('x'))); // settling twice changes nothing
    act(() => {
      void result.current.setStatus(a, 'in_process');
    });
    expect(result.current.error).toBeUndefined();
  });

  it('treats items independently: one failing does not undo the other', async () => {
    const { commit, calls } = controlledCommit();
    const { result } = renderHook(() => useOptimisticStatus([a, b], commit));

    act(() => {
      void result.current.setStatus(a, 'done');
      void result.current.setStatus(b, 'done');
    });
    expect(statuses(result.current.items)).toEqual(['a:done', 'b:done']);

    await act(async () => calls[0].reject(new RepositoryError('permission-denied', 'no')));
    expect(statuses(result.current.items)).toEqual(['a:pending', 'b:done']);

    await act(async () => calls[1].resolve());
    expect(result.current.savingIds.size).toBe(0);
  });

  it('only the latest change to an item counts when it is changed again while saving', async () => {
    const { commit, calls } = controlledCommit();
    const { result } = renderHook(() => useOptimisticStatus([a], commit));

    act(() => {
      void result.current.setStatus(a, 'done');
    });
    act(() => {
      void result.current.setStatus(a, 'in_process');
    });
    expect(statuses(result.current.items)).toEqual(['a:in_process']);

    // The first save fails late: it must not undo or complain about the newer change.
    await act(async () => calls[0].reject(new RepositoryError('unavailable', 'late')));
    expect(statuses(result.current.items)).toEqual(['a:in_process']);
    expect(result.current.error).toBeUndefined();
    expect(result.current.savingIds.has('a')).toBe(true);

    await act(async () => calls[1].resolve());
    expect(result.current.savingIds.size).toBe(0);
  });

  it('sets completedAt when done and clears it when leaving done', () => {
    const done = makeTask({ id: 'd', status: 'done', completedAt: new Date(2026, 9, 18, 9, 0) });
    const { commit } = controlledCommit();
    const { result } = renderHook(() => useOptimisticStatus([done], commit));

    act(() => {
      void result.current.setStatus(done, 'pending');
    });
    expect(result.current.items?.[0].status).toBe('pending');
    expect(result.current.items?.[0].completedAt).toBeUndefined();
  });

  it('passes a loading list through as undefined', () => {
    const { commit } = controlledCommit();
    const { result } = renderHook(() => useOptimisticStatus<Task>(undefined, commit));
    expect(result.current.items).toBeUndefined();
  });
});
