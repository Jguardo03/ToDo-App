import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/layout/screen';
import { SubtaskForm } from '@/components/task/subtask-form';
import { Button } from '@/components/ui/button';
import { ErrorBanner } from '@/components/ui/error-banner';
import { Colors, Spacing } from '@/constants/theme';
import type { NewSubtask } from '@/domain/types';
import { useCategories } from '@/hooks/use-categories';
import { useNow } from '@/hooks/use-now';
import { useTaskActions } from '@/hooks/use-task-actions';
import { useTasks } from '@/hooks/use-tasks';
import { userMessage } from '@/repositories/messages';

/** Add a subtask to the task in the address. The subtask inherits the task's category. */
export default function NewSubtaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const now = useNow();
  const tasks = useTasks();
  const categories = useCategories();
  const actions = useTaskActions();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (tasks.loading || categories.loading) {
    return (
      <Screen title="New Subtask">
        <ActivityIndicator accessibilityLabel="Loading task" color={Colors.primary} />
      </Screen>
    );
  }

  const task = tasks.data?.find((candidate) => candidate.id === id);
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

  const save = async (input: NewSubtask) => {
    setBusy(true);
    setError(undefined);
    try {
      await actions.createSubtask(task.id, input);
      close();
    } catch (failure) {
      setError(userMessage(failure));
    } finally {
      setBusy(false);
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
        busy={busy}
        onSubmit={save}
        onCancel={close}
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
