import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { CategoryForm } from '@/components/category/category-form';
import { Screen } from '@/components/layout/screen';
import { TaskForm } from '@/components/task/task-form';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { ErrorBanner } from '@/components/ui/error-banner';
import { Colors, Spacing } from '@/constants/theme';
import { isStatusKey } from '@/constants/statuses';
import type { NewCategory, NewTaskDraft } from '@/domain/types';
import { useCategories } from '@/hooks/use-categories';
import { useNow } from '@/hooks/use-now';
import { useTaskActions } from '@/hooks/use-task-actions';
import { userMessage } from '@/repositories/messages';
import { parseDateTimeInput } from '@/utils/dates';

/**
 * Create a task. Optional address parameters pre-fill the form:
 * `?categoryId=<id>` selects a category, `?date=YYYY-MM-DD` sets the due day (at 17:00),
 * `?status=pending|in_process|done` sets the status the new task starts with.
 */
export default function NewTaskScreen() {
  const { categoryId, date, status } = useLocalSearchParams<{ categoryId?: string; date?: string; status?: string }>();
  const router = useRouter();
  const now = useNow();
  const categories = useCategories();
  const actions = useTaskActions();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [createdCategoryId, setCreatedCategoryId] = useState<string>();

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const submit = async (draft: NewTaskDraft) => {
    setBusy(true);
    setError(undefined);
    try {
      await actions.createTask(draft);
      // Go back to where the person came from (Home keeps its place) instead of stacking a second Home.
      close();
    } catch (failure) {
      setError(userMessage(failure));
    } finally {
      setBusy(false);
    }
  };

  const createCategory = async (input: NewCategory) => {
    try {
      const created = await actions.createCategory(input);
      setCreatedCategoryId(created.id);
      setSheetOpen(false);
    } catch (failure) {
      setError(userMessage(failure));
      setSheetOpen(false);
    }
  };

  if (categories.loading) {
    return (
      <Screen title="New Task">
        <ActivityIndicator accessibilityLabel="Loading categories" color={Colors.primary} />
      </Screen>
    );
  }

  const initialDueAt = date ? parseDateTimeInput(`${date} 17:00`) : undefined;

  return (
    <View style={styles.page}>
      {error || categories.error ? (
        <View style={styles.banner}>
          <ErrorBanner message={error ?? userMessage(categories.error)} />
        </View>
      ) : null}
      <TaskForm
        categories={categories.data ?? []}
        now={now}
        initialCategoryId={categoryId}
        requestedCategoryId={createdCategoryId}
        initialDueAt={initialDueAt}
        initialStatus={isStatusKey(status) ? status : undefined}
        busy={busy}
        onSubmit={submit}
        onCancel={close}
        onCreateCategory={() => setSheetOpen(true)}
      />
      <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} title="New category">
        <CategoryForm onSubmit={createCategory} onCancel={() => setSheetOpen(false)} />
      </BottomSheet>
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
});
