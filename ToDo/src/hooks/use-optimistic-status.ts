import { useMemo, useRef, useState } from 'react';

import { applyStatus } from '@/domain/derive';
import type { StatusKey, Subtask, Task } from '@/domain/types';
import { useTaskActions } from '@/hooks/use-task-actions';
import { userMessage } from '@/repositories/messages';

type Item = { id: string; status: StatusKey; completedAt?: Date };
type Override = { status: StatusKey; completedAt: Date | undefined };

export type OptimisticStatus<T extends Item> = {
  /** The list with unconfirmed changes already applied. Undefined while the list is still loading. */
  items: T[] | undefined;
  /** Shows the new status at once, saves it, and puts the old one back with an error message if saving fails. */
  setStatus: (item: T, status: StatusKey) => Promise<void>;
  /** Ids with a save in flight (for a small "Saving..." mark). */
  savingIds: ReadonlySet<string>;
  error: string | undefined;
  clearError: () => void;
};

/**
 * Optimistic status changes. A tap changes what is on screen immediately; the write runs in the background.
 * Success: the live list soon agrees, and the temporary override is dropped. Failure: the override is dropped
 * (the old status returns) and `error` explains why. Each item is independent; if the same item is changed
 * again while saving, only the latest change counts.
 */
export function useOptimisticStatus<T extends Item>(
  items: readonly T[] | undefined,
  commit: (id: string, status: StatusKey) => Promise<void>,
): OptimisticStatus<T> {
  const [overrides, setOverrides] = useState<Record<string, Override>>({});
  const [error, setError] = useState<string>();
  const latest = useRef<Record<string, number>>({});
  const counter = useRef(0);

  const view = useMemo(
    () =>
      items?.map((item) => {
        const override = overrides[item.id];
        if (!override) return item;
        const { completedAt: _previous, ...rest } = item;
        return { ...rest, status: override.status, ...(override.completedAt ? { completedAt: override.completedAt } : {}) } as T;
      }),
    [items, overrides],
  );

  const drop = (id: string) =>
    setOverrides((current) => {
      const { [id]: _removed, ...rest } = current;
      return rest;
    });

  const setStatus = async (item: T, status: StatusKey) => {
    const token = (counter.current += 1);
    latest.current[item.id] = token;
    const next = applyStatus(item, status, new Date());
    setError(undefined);
    setOverrides((current) => ({ ...current, [item.id]: { status: next.status, completedAt: next.completedAt } }));
    try {
      await commit(item.id, status);
    } catch (failure) {
      if (latest.current[item.id] === token) setError(userMessage(failure));
    } finally {
      if (latest.current[item.id] === token) drop(item.id);
    }
  };

  return {
    items: view,
    setStatus,
    savingIds: new Set(Object.keys(overrides)),
    error,
    clearError: () => setError(undefined),
  };
}

/** Optimistic status changes for the signed-in user's tasks. */
export function useOptimisticTasks(tasks: readonly Task[] | undefined): OptimisticStatus<Task> {
  const { setTaskStatus } = useTaskActions();
  return useOptimisticStatus(tasks, setTaskStatus);
}

/** Optimistic status changes for one task's subtasks. */
export function useOptimisticSubtasks(taskId: string, subtasks: readonly Subtask[] | undefined): OptimisticStatus<Subtask> {
  const { setSubtaskStatus } = useTaskActions();
  return useOptimisticStatus(subtasks, (id, status) => setSubtaskStatus(taskId, id, status));
}
