import { useRouter } from 'expo-router';
import { useState } from 'react';

import { HomeContent } from '@/components/home/home-content';
import { useCategories } from '@/hooks/use-categories';
import { useNow } from '@/hooks/use-now';
import { useOptimisticTasks } from '@/hooks/use-optimistic-status';
import { useTaskActions } from '@/hooks/use-task-actions';
import { useTasks } from '@/hooks/use-tasks';
import { userMessage } from '@/repositories/messages';

export default function HomeScreen() {
  const router = useRouter();
  const now = useNow();
  const tasks = useTasks();
  const categories = useCategories();
  const actions = useTaskActions();
  // Ticks show at once and are put back with a message if saving fails.
  const optimistic = useOptimisticTasks(tasks.data);
  const [actionError, setActionError] = useState<string>();

  const loadError = tasks.error ?? categories.error;

  const quickAdd = async (task: Parameters<typeof actions.createTask>[0]['task']) => {
    setActionError(undefined);
    try {
      await actions.createTask({ task, subtasks: [] });
    } catch (error) {
      setActionError(userMessage(error));
    }
  };

  return (
    <HomeContent
      now={now}
      tasks={optimistic.items ?? []}
      categories={categories.data ?? []}
      loading={tasks.loading || categories.loading}
      error={optimistic.error ?? actionError ?? (loadError ? userMessage(loadError) : undefined)}
      // Ticking a task marks it done; unticking puts it back to pending.
      onToggleDone={(task, done) => optimistic.setStatus(task, done ? 'done' : 'pending')}
      onOpenTask={(task) => router.push({ pathname: '/task/[id]', params: { id: task.id } })}
      onQuickAdd={quickAdd}
      onAddTask={() => router.push('/task/new')}
      onBrowseCategories={() => router.push('/categories')}
      onOpenStatus={(status) => router.push({ pathname: '/status/[status]', params: { status } })}
    />
  );
}
