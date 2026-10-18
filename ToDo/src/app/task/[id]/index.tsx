import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/layout/screen';
import { TaskDetail } from '@/components/task/task-detail';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Colors, Spacing } from '@/constants/theme';
import { useCategories } from '@/hooks/use-categories';
import { useNow } from '@/hooks/use-now';
import { useOptimisticSubtasks, useOptimisticTasks } from '@/hooks/use-optimistic-status';
import { useSubtasks } from '@/hooks/use-subtasks';
import { useTaskActions } from '@/hooks/use-task-actions';
import { useTasks } from '@/hooks/use-tasks';
import { userMessage } from '@/repositories/messages';

export default function TaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const now = useNow();
  const tasks = useTasks();
  const categories = useCategories();
  const subtasks = useSubtasks(id);
  const actions = useTaskActions();
  const optimisticTasks = useOptimisticTasks(tasks.data);
  const optimisticSubtasks = useOptimisticSubtasks(id, subtasks.data);

  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string>();

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (tasks.loading || deleting) {
    return (
      <Screen title="Task">
        <ActivityIndicator accessibilityLabel="Loading task" color={Colors.primary} />
      </Screen>
    );
  }

  const task = optimisticTasks.items?.find((candidate) => candidate.id === id);
  if (!task) {
    return (
      <Screen title="Task not found" subtitle="It may have been deleted.">
        <View style={styles.back}>
          <Button label="Back" variant="secondary" icon="back" onPress={close} />
        </View>
      </Screen>
    );
  }

  const category = categories.data?.find((candidate) => candidate.id === task.categoryId);
  const loadError = tasks.error ?? subtasks.error;

  const deleteTask = async () => {
    setConfirmOpen(false);
    setDeleting(true);
    try {
      await actions.deleteTask(task.id);
      close();
    } catch (error) {
      setDeleting(false);
      setActionError(userMessage(error));
    }
  };

  return (
    <>
      <TaskDetail
        task={task}
        category={category}
        subtasks={optimisticSubtasks.items}
        now={now}
        error={optimisticTasks.error ?? optimisticSubtasks.error ?? actionError ?? (loadError ? userMessage(loadError) : undefined)}
        onBack={close}
        onOpenMenu={() => setMenuOpen(true)}
        onSetStatus={(status) => optimisticTasks.setStatus(task, status)}
        onToggleSubtask={(subtask, done) => optimisticSubtasks.setStatus(subtask, done ? 'done' : 'pending')}
        onOpenSubtask={(subtask) =>
          router.push({ pathname: '/task/[id]/subtask/[subtaskId]', params: { id: task.id, subtaskId: subtask.id } })
        }
        onAddSubtask={() => router.push({ pathname: '/task/[id]/subtask-new', params: { id: task.id } })}
      />

      <BottomSheet visible={menuOpen} onClose={() => setMenuOpen(false)} title="Task options">
        <View style={styles.menu}>
          <Button
            label="Edit Task"
            variant="secondary"
            icon="edit"
            onPress={() => {
              setMenuOpen(false);
              router.push({ pathname: '/task/[id]/edit', params: { id: task.id } });
            }}
          />
          <Button
            label="Delete Task"
            variant="danger"
            icon="delete"
            onPress={() => {
              setMenuOpen(false);
              setConfirmOpen(true);
            }}
          />
        </View>
      </BottomSheet>

      <ConfirmDialog
        visible={confirmOpen}
        title="Delete this task?"
        message={`"${task.name}" and all of its subtasks will be deleted. This cannot be undone.`}
        confirmLabel="Delete Task"
        onConfirm={deleteTask}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  back: {
    paddingTop: Spacing.md,
    alignItems: 'flex-start',
  },
  menu: {
    gap: Spacing.md,
  },
});
