import { useEffect, useState } from 'react';

import { useRepositories } from '@/context/repositories';
import { useUsername } from '@/context/session';
import type { Subtask } from '@/domain/types';
import type { LiveList } from '@/hooks/use-live-list';
import type { RepositoryError } from '@/repositories/errors';

type State = { taskId: string; data?: Subtask[]; error?: RepositoryError };

/** One task's subtasks, oldest first, updating live. Loading again when `taskId` changes. */
export function useSubtasks(taskId: string): LiveList<Subtask> {
  const { subtasks } = useRepositories();
  const username = useUsername();
  const [state, setState] = useState<State>({ taskId });

  useEffect(() => {
    return subtasks.subscribe(
      username,
      taskId,
      (data) => setState({ taskId, data }),
      (error) => setState({ taskId, error }),
    );
  }, [subtasks, username, taskId]);

  const current = state.taskId === taskId ? state : undefined;
  return {
    data: current?.data,
    error: current?.error,
    loading: current === undefined || (current.data === undefined && current.error === undefined),
  };
}
