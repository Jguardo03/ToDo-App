import { useLocalSearchParams, useRouter } from 'expo-router';

import { Screen } from '@/components/layout/screen';
import { StatusList } from '@/components/task/status-list';
import { STATUSES } from '@/constants/statuses';
import { tasksWithDisplayStatus } from '@/domain/derive';
import type { DisplayStatusKey } from '@/domain/types';
import { useCategories } from '@/hooks/use-categories';
import { useNow } from '@/hooks/use-now';
import { useOptimisticTasks } from '@/hooks/use-optimistic-status';
import { useTasks } from '@/hooks/use-tasks';
import { userMessage } from '@/repositories/messages';

/** Every task in one state; reached from the Home stat cards. */
export default function StatusScreen() {
  const { status } = useLocalSearchParams<{ status: string }>();
  const router = useRouter();
  const now = useNow();
  const tasks = useTasks();
  const categories = useCategories();
  const optimistic = useOptimisticTasks(tasks.data);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (!(status in STATUSES)) {
    return <Screen title="Not found" subtitle="There is no such status." />;
  }
  const key = status as DisplayStatusKey;
  const loadError = tasks.error ?? categories.error;

  return (
    <StatusList
      status={key}
      tasks={tasksWithDisplayStatus(optimistic.items ?? [], key, now)}
      categories={categories.data ?? []}
      now={now}
      loading={tasks.loading || categories.loading}
      error={optimistic.error ?? (loadError ? userMessage(loadError) : undefined)}
      onBack={close}
      onToggleDone={(task, done) => optimistic.setStatus(task, done ? 'done' : 'pending')}
      onOpenTask={(task) => router.push({ pathname: '/task/[id]', params: { id: task.id } })}
      // "Overdue" is a state you can be in, not one you can start a task in.
      onAddTask={key === 'overdue' ? undefined : () => router.push({ pathname: '/task/new', params: { status: key } })}
    />
  );
}
