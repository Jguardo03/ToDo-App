import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { TaskCard } from '@/components/task/task-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { ErrorBanner } from '@/components/ui/error-banner';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { ThemedText } from '@/components/themed-text';
import { Colors, Layout, Radius, Spacing } from '@/constants/theme';
import { orderCategoryTasks } from '@/domain/categories';
import { categoryStats } from '@/domain/derive';
import type { Category, Task } from '@/domain/types';
import { withAlpha } from '@/utils/colors';

type CategoryDetailProps = {
  category: Pick<Category, 'name' | 'description' | 'color'>;
  /** The tasks in this category. */
  tasks: readonly Task[];
  now: Date;
  loading?: boolean;
  error?: string;
  onBack: () => void;
  onOpenMenu: () => void;
  onToggleDone: (task: Task, done: boolean) => void;
  onOpenTask: (task: Task) => void;
  onAddTask: () => void;
};

/** One category: its numbers and its tasks (mockups: mobile_category_registry). Pure; data and actions are props. */
export function CategoryDetail({
  category,
  tasks,
  now,
  loading,
  error,
  onBack,
  onOpenMenu,
  onToggleDone,
  onOpenTask,
  onAddTask,
}: CategoryDetailProps) {
  const stats = categoryStats(tasks, now);
  const percent = Math.round(stats.doneRatio * 100);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.page}>
        <View style={styles.topRow}>
          <IconButton icon="back" label="Back" onPress={onBack} />
          <ThemedText variant="headlineSm">Category Detail</ThemedText>
          <IconButton icon="moreHorizontal" label="Category options" onPress={onOpenMenu} />
        </View>

        <View style={styles.stack}>
          <ThemedText variant="labelXs" color="primary">
            Category overview
          </ThemedText>
          <View style={styles.titleRow}>
            <View style={[styles.tile, { backgroundColor: withAlpha(category.color, 0.18) }]}>
              <Icon name="folder" size={26} color="onSurface" />
            </View>
            <ThemedText variant="headlineXl" style={styles.title} accessibilityRole="header">
              {category.name}
            </ThemedText>
            <Chip label={`${stats.total} ${stats.total === 1 ? 'Task' : 'Tasks'}`} background={withAlpha(category.color, 0.16)} foreground={category.color} />
          </View>
          <ThemedText variant="bodyLg" color="onSurfaceVariant">
            {category.description || 'No description yet.'}
          </ThemedText>
        </View>

        {error ? <ErrorBanner message={error} /> : null}

        <View style={styles.stats}>
          <Card style={styles.stat}>
            <ThemedText variant="labelXs" color="onSurfaceVariant">
              Done ratio
            </ThemedText>
            <ThemedText variant="headlineLg">{`${percent}%`}</ThemedText>
          </Card>
          <Card style={styles.stat}>
            <ThemedText variant="labelXs" color="onSurfaceVariant">
              Overdue
            </ThemedText>
            <View style={styles.inline}>
              <ThemedText variant="headlineLg" color={stats.overdue > 0 ? 'error' : 'onSurface'}>
                {String(stats.overdue)}
              </ThemedText>
              <ThemedText variant="bodySm" color="onSurfaceVariant">
                {stats.overdue === 1 ? 'task' : 'tasks'}
              </ThemedText>
            </View>
          </Card>
        </View>

        <View style={styles.stack}>
          <ThemedText variant="labelXs" color="onSurfaceVariant" accessibilityRole="header">
            Category tasks
          </ThemedText>
          {loading ? (
            <ActivityIndicator accessibilityLabel="Loading tasks" color={Colors.primary} />
          ) : tasks.length === 0 ? (
            <ThemedText variant="bodyMd" color="onSurfaceVariant">
              No tasks in this category yet.
            </ThemedText>
          ) : (
            orderCategoryTasks(tasks).map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                category={category}
                now={now}
                variant="category"
                onPress={() => onOpenTask(task)}
                onToggleDone={(done) => onToggleDone(task, done)}
              />
            ))
          )}
        </View>

        <Button label="Add Task to Category" icon="add" onPress={onAddTask} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    padding: Spacing.margin,
  },
  page: {
    width: '100%',
    maxWidth: Layout.detailMaxWidth,
    gap: Spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stack: {
    gap: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  tile: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
  },
  title: {
    flex: 1,
  },
  stats: {
    flexDirection: 'row',
    gap: Spacing.gutter,
  },
  stat: {
    flex: 1,
    gap: Spacing.xs,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.xs,
  },
});
