import { useRouter } from 'expo-router';
import { useState } from 'react';

import { HomeContent } from '@/components/home/home-content';
import { useCategories } from '@/hooks/use-categories';
import { useNow } from '@/hooks/use-now';
import { useTaskActions } from '@/hooks/use-task-actions';
import { useTasks } from '@/hooks/use-tasks';
import { userMessage } from '@/repositories/messages';

export default function HomeScreen() {
  const router = useRouter();
  const now = useNow();
  const tasks = useTasks();
  const categories = useCategories();
  const actions = useTaskActions();
  const [actionError, setActionError] = useState<string>();

  const loadError = tasks.error ?? categories.error;

  const run = async (action: () => Promise<unknown>) => {
    setActionError(undefined);
    try {
      await action();
    } catch (error) {
      setActionError(userMessage(error));
    }
  };

  return (
    <HomeContent
      now={now}
      tasks={tasks.data ?? []}
      categories={categories.data ?? []}
      loading={tasks.loading || categories.loading}
      error={actionError ?? (loadError ? userMessage(loadError) : undefined)}
      // Ticking a task marks it done; unticking puts it back to pending.
      onToggleDone={(task, done) => run(() => actions.setTaskStatus(task.id, done ? 'done' : 'pending'))}
      onQuickAdd={(task) => run(() => actions.createTask({ task, subtasks: [] }))}
      onAddTask={() => router.push('/task/new')}
      onBrowseCategories={() => router.push('/categories')}
      onOpenStatus={(status) => router.push({ pathname: '/status/[status]', params: { status } })}
    />
  );
}
