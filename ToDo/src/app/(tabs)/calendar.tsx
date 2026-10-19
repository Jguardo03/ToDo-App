import { useRouter } from 'expo-router';

import { CalendarContent } from '@/components/calendar/calendar-content';
import { useCategories } from '@/hooks/use-categories';
import { useNow } from '@/hooks/use-now';
import { useTasks } from '@/hooks/use-tasks';
import { userMessage } from '@/repositories/messages';
import { toDayKey } from '@/utils/dates';

export default function CalendarScreen() {
  const router = useRouter();
  const now = useNow();
  const tasks = useTasks();
  const categories = useCategories();
  const loadError = tasks.error ?? categories.error;

  return (
    <CalendarContent
      now={now}
      tasks={tasks.data ?? []}
      categories={categories.data ?? []}
      loading={tasks.loading}
      error={loadError ? userMessage(loadError) : undefined}
      onOpenTask={(task) => router.push({ pathname: '/task/[id]', params: { id: task.id } })}
      onAddSubtask={(task) => router.push({ pathname: '/task/[id]/subtask-new', params: { id: task.id } })}
      onAddTask={(day) => router.push({ pathname: '/task/new', params: { date: toDayKey(day) } })}
    />
  );
}
