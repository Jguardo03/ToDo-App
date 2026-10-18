import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { CategoryChip } from '@/components/category/category-chip';
import { PriorityChip } from '@/components/task/priority-chip';
import { StatusPicker } from '@/components/task/status-picker';
import { SubtaskRow } from '@/components/task/subtask-row';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { ErrorBanner } from '@/components/ui/error-banner';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { ThemedText } from '@/components/themed-text';
import { Colors, Layout, Radius, Spacing } from '@/constants/theme';
import { allSubtasksDone, isOverdue, progressPercent, subtaskProgress } from '@/domain/derive';
import type { Category, StatusKey, Subtask, Task } from '@/domain/types';
import { formatDateTime } from '@/utils/dates';

type TaskDetailProps = {
  task: Task;
  category?: Pick<Category, 'name' | 'color'>;
  /** Undefined while the subtasks are loading. */
  subtasks: readonly Subtask[] | undefined;
  now: Date;
  error?: string;
  onBack: () => void;
  onOpenMenu: () => void;
  onSetStatus: (status: StatusKey) => void;
  onToggleSubtask: (subtask: Subtask, done: boolean) => void;
  onOpenSubtask: (subtask: Subtask) => void;
  onAddSubtask: () => void;
};

/** One task: tags, due date, description, progress, lifecycle, subtasks (mockups: mobile_task). Pure; data and actions are props. */
export function TaskDetail({
  task,
  category,
  subtasks,
  now,
  error,
  onBack,
  onOpenMenu,
  onSetStatus,
  onToggleSubtask,
  onOpenSubtask,
  onAddSubtask,
}: TaskDetailProps) {
  const done = task.status === 'done';
  const overdue = isOverdue(task, now);
  // The list on screen is the freshest source (it already shows ticks that are still saving).
  const counts = subtasks ? subtaskProgress(subtasks) : { done: task.subtaskDone, total: task.subtaskTotal, fraction: 0 };
  const percent = progressPercent({ status: task.status, subtaskTotal: counts.total, subtaskDone: counts.done });
  const finished = subtasks ? allSubtasksDone(subtasks) : false;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.page}>
        <View style={styles.topRow}>
          <IconButton icon="back" label="Back" onPress={onBack} />
          <View style={styles.tags}>
            {category ? <CategoryChip name={category.name} color={category.color} /> : null}
            <PriorityChip priority={task.priority} />
          </View>
          <IconButton icon="moreHorizontal" label="Task options" onPress={onOpenMenu} />
        </View>

        <View style={styles.stack}>
          <ThemedText variant="labelXs" color="onSurfaceVariant">
            {`Task // ${task.id.slice(0, 6)}`}
          </ThemedText>
          <ThemedText variant="headlineXl" accessibilityRole="header">
            {task.name}
          </ThemedText>
        </View>

        {error ? <ErrorBanner message={error} /> : null}

        <Card tone="muted" style={styles.inline}>
          <Icon name="calendar" size={18} color={overdue ? 'error' : 'primary'} />
          <ThemedText variant="labelMd" color={overdue ? 'error' : 'onSurface'}>
            {formatDateTime(task.dueAt)}
          </ThemedText>
          {overdue ? <Chip label="Overdue" background="errorContainer" foreground="onErrorContainer" /> : null}
        </Card>

        <Card style={styles.stack}>
          <ThemedText variant="labelXs" color="onSurfaceVariant">
            Scope &amp; Objectives
          </ThemedText>
          <ThemedText variant="bodyLg" color={task.description ? 'onSurface' : 'outline'}>
            {task.description || 'No description yet.'}
          </ThemedText>
        </Card>

        <Card tone="muted" style={styles.stack}>
          <View style={styles.spread}>
            <View>
              <ThemedText variant="labelXs" color="onSurfaceVariant">
                Execution Status
              </ThemedText>
              <ThemedText variant="headlineLg">{`${percent}% Completed`}</ThemedText>
            </View>
            {counts.total > 0 ? <Chip size="md" label={`${counts.done} of ${counts.total} Done`} /> : null}
          </View>
          <ProgressBar value={percent / 100} label="Task progress" height={10} />
          {counts.total > 0 ? (
            <View style={styles.segments}>
              {Array.from({ length: Math.min(counts.total, 12) }, (_, index) => (
                <View key={index} style={[styles.segment, index < counts.done && styles.segmentDone]} />
              ))}
            </View>
          ) : null}
        </Card>

        <View style={styles.stack}>
          <ThemedText variant="labelXs" color="onSurfaceVariant">
            Lifecycle State
          </ThemedText>
          <StatusPicker value={task.status} overdue={overdue} onChange={onSetStatus} />
        </View>

        <View style={styles.stack}>
          <View style={styles.spread}>
            <View style={styles.inline}>
              <ThemedText variant="headlineLg" accessibilityRole="header">
                Subtasks
              </ThemedText>
              <Chip label={`${counts.done}/${counts.total}`} />
            </View>
            <Button label="Add" variant="secondary" icon="add" onPress={onAddSubtask} />
          </View>
          {subtasks === undefined ? (
            <ActivityIndicator accessibilityLabel="Loading subtasks" color={Colors.primary} />
          ) : subtasks.length === 0 ? (
            <ThemedText variant="bodyMd" color="onSurfaceVariant">
              No subtasks yet. Add one to break this task into steps.
            </ThemedText>
          ) : (
            subtasks.map((subtask) => (
              <SubtaskRow
                key={subtask.id}
                subtask={subtask}
                now={now}
                onToggle={(next) => onToggleSubtask(subtask, next)}
                onPress={() => onOpenSubtask(subtask)}
              />
            ))
          )}
        </View>

        {finished && !done ? (
          <ThemedText variant="bodyMd" color="secondary" accessibilityRole="alert">
            All subtasks are done. Finish the task?
          </ThemedText>
        ) : null}
        {done ? (
          <Button label="Reopen Task" variant="secondary" icon="inProcess" onPress={() => onSetStatus('pending')} />
        ) : (
          <Button label="Finish Task" icon="checkCircle" onPress={() => onSetStatus('done')} />
        )}
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
    gap: Spacing.sm,
  },
  tags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexShrink: 1,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  stack: {
    gap: Spacing.sm,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  spread: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  segments: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainerHighest,
  },
  segmentDone: {
    backgroundColor: Colors.primary,
  },
});
