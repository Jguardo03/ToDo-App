import { useMemo } from 'react';

import { useRepositories } from '@/context/repositories';
import { useUsername } from '@/context/session';
import type { Category, NewCategory, NewTaskDraft, StatusKey, Task } from '@/domain/types';
import { RepositoryError } from '@/repositories/errors';
import { userMessage } from '@/repositories/messages';

export type TaskActions = {
  /** Saves the task, then its subtasks. Rejects with a `RepositoryError`. */
  createTask: (draft: NewTaskDraft) => Promise<Task>;
  setTaskStatus: (taskId: string, status: StatusKey) => Promise<void>;
  createCategory: (input: NewCategory) => Promise<Category>;
};

/** Writes for the signed-in user. Screens call these; they never touch repositories directly. */
export function useTaskActions(): TaskActions {
  const { tasks, subtasks, categories } = useRepositories();
  const username = useUsername();

  return useMemo<TaskActions>(
    () => ({
      async createTask({ task, subtasks: drafts }) {
        const created = await tasks.create(username, task);
        for (const draft of drafts) {
          try {
            await subtasks.create(username, created.id, draft);
          } catch (error) {
            throw new RepositoryError(
              'unknown',
              `The task was saved, but a subtask was not: ${userMessage(error)}`,
              { cause: error },
            );
          }
        }
        return created;
      },
      setTaskStatus: (taskId, status) => tasks.setStatus(username, taskId, status),
      createCategory: (input) => categories.create(username, input),
    }),
    [tasks, subtasks, categories, username],
  );
}
