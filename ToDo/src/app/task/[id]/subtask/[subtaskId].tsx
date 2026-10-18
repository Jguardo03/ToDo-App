import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/layout/screen';
import { SubtaskForm } from '@/components/task/subtask-form';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ErrorBanner } from '@/components/ui/error-banner';
import { Colors, Spacing } from '@/constants/theme';
import type { NewSubtask } from '@/domain/types';
import { useCategories } from '@/hooks/use-categories';
import { useNow } from '@/hooks/use-now';
import { useSubtasks } from '@/hooks/use-subtasks';
import { useTaskActions } from '@/hooks/use-task-actions';
import { useTasks } from '@/hooks/use-tasks';
import { userMessage } from '@/repositories/messages';

/** Edit or delete one subtask. */
export default function EditSubtaskScreen() {
  const { id, subtaskId } = useLocalSearchParams<{ id: string; subtaskId: string }>();
  const router = useRouter();
  const now = useNow();
  const tasks = useTasks();
  const categories = useCategories();
  const subtasks = useSubtasks(id);
  const actions = useTaskActions();
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string>();

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (tasks.loading || categories.loading || subtasks.loading) {
    return (
      <Screen title="Edit Subtask">
        <ActivityIndicator accessibilityLabel="Loading subtask" color={Colors.primary} />
      </Screen>
    );
  }

  const task = tasks.data?.find((candidate) => candidate.id === id);
  const subtask = subtasks.data?.find((candidate) => candidate.id === subtaskId);
  if (!task || !subtask) {
    return (
      <Screen title="Subtask not found" subtitle="It may have been deleted.">
        <View style={styles.back}>
          <Button label="Back" variant="secondary" icon="back" onPress={close} />
        </View>
      </Screen>
    );
  }

  const category = categories.data?.find((candidate) => candidate.id === task.categoryId);

  const save = async (input: NewSubtask) => {
    setBusy(true);
    setError(undefined);
    try {
      await actions.updateSubtask(task.id, subtask.id, {
        name: input.name,
        description: input.description,
        priority: input.priority,
        dueAt: input.dueAt,
      });
      close();
    } catch (failure) {
      setError(userMessage(failure));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setConfirmOpen(false);
    setBusy(true);
    try {
      await actions.deleteSubtask(task.id, subtask.id);
      close();
    } catch (failure) {
      setBusy(false);
      setError(userMessage(failure));
    }
  };

  return (
    <View style={styles.page}>
      {error ? (
        <View style={styles.banner}>
          <ErrorBanner message={error} />
        </View>
      ) : null}
      <SubtaskForm
        parent={{ id: task.id, name: task.name, dueAt: task.dueAt, category: category ?? { name: 'Uncategorised', color: Colors.outline } }}
        now={now}
        initial={subtask}
        busy={busy}
        onSubmit={save}
        onCancel={close}
        onDelete={() => setConfirmOpen(true)}
      />
      <ConfirmDialog
        visible={confirmOpen}
        title="Delete this subtask?"
        message={`"${subtask.name}" will be deleted. This cannot be undone.`}
        confirmLabel="Delete Subtask"
        onConfirm={remove}
        onCancel={() => setConfirmOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  banner: {
    padding: Spacing.margin,
    paddingBottom: 0,
  },
  back: {
    paddingTop: Spacing.md,
    alignItems: 'flex-start',
  },
});
