import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { TaskCard } from '@/components/task/task-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { ErrorBanner } from '@/components/ui/error-banner';
import { Icon, type IconName } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { ThemedText } from '@/components/themed-text';
import { STATUSES } from '@/constants/statuses';
import { Colors, Layout, Radius, Spacing } from '@/constants/theme';
import type { Category, DisplayStatusKey, Task } from '@/domain/types';

const ICON: Record<DisplayStatusKey, IconName> = {
  overdue: 'overdue',
  in_process: 'inProcess',
  done: 'checkCircle',
  pending: 'pending',
};

type StatusListProps = {
  status: DisplayStatusKey;
  /** The tasks currently shown as this status. */
  tasks: readonly Task[];
  categories: readonly Category[];
  now: Date;
  loading?: boolean;
  error?: string;
  onBack: () => void;
  onToggleDone: (task: Task, done: boolean) => void;
  onOpenTask: (task: Task) => void;
  /** Omit for statuses you cannot create a task in (overdue). */
  onAddTask?: () => void;
};

/** All tasks in one state (mockups: mobile_status). Reached from the Home stat cards. */
export function StatusList({
  status,
  tasks,
  categories,
  now,
  loading,
  error,
  onBack,
  onToggleDone,
  onOpenTask,
  onAddTask,
}: StatusListProps) {
  const info = STATUSES[status];
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.page}>
        <View style={styles.topRow}>
          <IconButton icon="back" label="Back" onPress={onBack} />
        </View>

        <Card style={styles.stack}>
          <View style={styles.header}>
            <View style={[styles.tile, { backgroundColor: Colors[info.background] }]}>
              <Icon name={ICON[status]} size={28} color={info.foreground} />
            </View>
            <View style={styles.titles}>
              <ThemedText variant="headlineXl" accessibilityRole="header">
                {info.name}
              </ThemedText>
            </View>
            <Chip label={`${tasks.length} ${tasks.length === 1 ? 'Task' : 'Tasks'}`} />
          </View>
          <ThemedText variant="bodyMd" color="onSurfaceVariant">
            {info.description}
          </ThemedText>
        </Card>

        {error ? <ErrorBanner message={error} /> : null}

        {loading ? (
          <ActivityIndicator accessibilityLabel="Loading tasks" color={Colors.primary} />
        ) : tasks.length === 0 ? (
          <ThemedText variant="bodyMd" color="onSurfaceVariant">
            {`No ${info.name.toLowerCase()} tasks right now.`}
          </ThemedText>
        ) : (
          <View style={styles.stack}>
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                category={categoryById.get(task.categoryId)}
                now={now}
                variant="status"
                onPress={() => onOpenTask(task)}
                onToggleDone={(done) => onToggleDone(task, done)}
              />
            ))}
          </View>
        )}

        {onAddTask ? <Button label="Add Task to Status" icon="add" onPress={onAddTask} /> : null}
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
  },
  stack: {
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  tile: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
  },
  titles: {
    flex: 1,
  },
});
