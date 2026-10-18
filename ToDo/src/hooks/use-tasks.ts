import { useRepositories } from '@/context/repositories';
import { useUsername } from '@/context/session';
import type { Task } from '@/domain/types';
import { useLiveList, type LiveList } from '@/hooks/use-live-list';

/** All of the signed-in user's tasks, soonest due first, updating live. */
export function useTasks(): LiveList<Task> {
  const { tasks } = useRepositories();
  return useLiveList(tasks, useUsername());
}
