import { useMemo } from 'react';

import { useRepositories } from '@/context/repositories';
import { useUsername } from '@/context/session';
import type {
  Category,
  NewCategory,
  NewSubtask,
  NewTaskDraft,
  StatusKey,
  Subtask,
  SubtaskPatch,
  Task,
  TaskPatch,
} from '@/domain/types';
import { RepositoryError } from '@/repositories/errors';
import { userMessage } from '@/repositories/messages';

export type TaskActions = {
  /** Saves the task, then its subtasks. Rejects with a `RepositoryError`. */
  createTask: (draft: NewTaskDraft) => Promise<Task>;
  updateTask: (taskId: string, patch: TaskPatch) => Promise<void>;
  setTaskStatus: (taskId: string, status: StatusKey) => Promise<void>;
  /** Deletes the task and all its subtasks. */
  deleteTask: (taskId: string) => Promise<void>;
  createSubtask: (taskId: string, input: NewSubtask) => Promise<Subtask>;
  updateSubtask: (taskId: string, subtaskId: string, patch: SubtaskPatch) => Promise<void>;
  setSubtaskStatus: (taskId: string, subtaskId: string, status: StatusKey) => Promise<void>;
  deleteSubtask: (taskId: string, subtaskId: string) => Promise<void>;
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
      updateTask: (taskId, patch) => tasks.update(username, taskId, patch),
      setTaskStatus: (taskId, status) => tasks.setStatus(username, taskId, status),
      deleteTask: (taskId) => tasks.remove(username, taskId),
      createSubtask: (taskId, input) => subtasks.create(username, taskId, input),
      updateSubtask: (taskId, subtaskId, patch) => subtasks.update(username, taskId, subtaskId, patch),
      setSubtaskStatus: (taskId, subtaskId, status) => subtasks.setStatus(username, taskId, subtaskId, status),
      deleteSubtask: (taskId, subtaskId) => subtasks.remove(username, taskId, subtaskId),
      createCategory: (input) => categories.create(username, input),
    }),
    [tasks, subtasks, categories, username],
  );
}
