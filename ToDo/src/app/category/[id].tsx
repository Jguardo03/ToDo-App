import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { CategoryDetail } from '@/components/category/category-detail';
import { CategoryForm } from '@/components/category/category-form';
import { Screen } from '@/components/layout/screen';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import type { NewCategory } from '@/domain/types';
import { useCategories } from '@/hooks/use-categories';
import { useNow } from '@/hooks/use-now';
import { useOptimisticTasks } from '@/hooks/use-optimistic-status';
import { useTaskActions } from '@/hooks/use-task-actions';
import { useTasks } from '@/hooks/use-tasks';
import { userMessage } from '@/repositories/messages';

export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const now = useNow();
  const categories = useCategories();
  const tasks = useTasks();
  const optimistic = useOptimisticTasks(tasks.data);
  const actions = useTaskActions();

  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string>();

  const close = () => (router.canGoBack() ? router.back() : router.replace('/categories'));

  if (categories.loading) {
    return (
      <Screen title="Category">
        <ActivityIndicator accessibilityLabel="Loading category" color={Colors.primary} />
      </Screen>
    );
  }

  const category = categories.data?.find((candidate) => candidate.id === id);
  if (!category) {
    return (
      <Screen title="Category not found" subtitle="It may have been deleted.">
        <View style={styles.back}>
          <Button label="Back" variant="secondary" icon="back" onPress={close} />
        </View>
      </Screen>
    );
  }

  const own = (optimistic.items ?? []).filter((task) => task.categoryId === category.id);
  const loadError = tasks.error ?? categories.error;

  const save = async (input: NewCategory) => {
    setBusy(true);
    setActionError(undefined);
    try {
      await actions.updateCategory(category.id, input);
      setEditOpen(false);
    } catch (error) {
      setActionError(userMessage(error));
      setEditOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setConfirmOpen(false);
    setBusy(true);
    try {
      await actions.deleteCategory(category.id);
      close();
    } catch (error) {
      setBusy(false);
      setActionError(userMessage(error));
    }
  };

  return (
    <>
      <CategoryDetail
        category={category}
        tasks={own}
        now={now}
        loading={tasks.loading}
        error={optimistic.error ?? actionError ?? (loadError ? userMessage(loadError) : undefined)}
        onBack={close}
        onOpenMenu={() => setMenuOpen(true)}
        onToggleDone={(task, done) => optimistic.setStatus(task, done ? 'done' : 'pending')}
        onOpenTask={(task) => router.push({ pathname: '/task/[id]', params: { id: task.id } })}
        onAddTask={() => router.push({ pathname: '/task/new', params: { categoryId: category.id } })}
      />

      <BottomSheet visible={menuOpen} onClose={() => setMenuOpen(false)} title="Category options">
        <View style={styles.menu}>
          <Button
            label="Edit Category"
            variant="secondary"
            icon="edit"
            onPress={() => {
              setMenuOpen(false);
              setEditOpen(true);
            }}
          />
          {own.length > 0 ? (
            <ThemedText variant="bodyMd" color="onSurfaceVariant">
              {`This category has ${own.length} ${own.length === 1 ? 'task' : 'tasks'}. Move or delete ${own.length === 1 ? 'it' : 'them'} before deleting the category.`}
            </ThemedText>
          ) : (
            <Button
              label="Delete Category"
              variant="danger"
              icon="delete"
              onPress={() => {
                setMenuOpen(false);
                setConfirmOpen(true);
              }}
            />
          )}
        </View>
      </BottomSheet>

      <BottomSheet visible={editOpen} onClose={() => setEditOpen(false)} title="Edit category">
        <CategoryForm
          initial={{ name: category.name, description: category.description, color: category.color }}
          submitLabel="Save Changes"
          busy={busy}
          onSubmit={save}
          onCancel={() => setEditOpen(false)}
        />
      </BottomSheet>

      <ConfirmDialog
        visible={confirmOpen}
        title="Delete this category?"
        message={`"${category.name}" will be deleted. This cannot be undone.`}
        confirmLabel="Delete Category"
        onConfirm={remove}
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
