import { Pressable, StyleSheet, View } from 'react-native';

import { CategoryChip } from '@/components/category/category-chip';
import { PriorityChip } from '@/components/task/priority-chip';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { ProgressBar } from '@/components/ui/progress-bar';
import { ThemedText } from '@/components/themed-text';
import { PRIORITIES } from '@/constants/priorities';
import { Colors, Spacing } from '@/constants/theme';
import { descriptionPreview } from '@/domain/calendar';
import { isOverdue, progress } from '@/domain/derive';
import type { Category, Task } from '@/domain/types';
import { formatTimeRange } from '@/utils/dates';

type TimeBlockProps = {
  task: Task;
  category?: Pick<Category, 'name' | 'color'>;
  now: Date;
  onPress: () => void;
  /** When given, an "Add new subtask…" row is shown under the block (desktop Calendar). */
  onAddSubtask?: () => void;
};

/** One task on the day timeline: category and priority, title, description, time range and subtask progress. */
export function TimeBlock({ task, category, now, onPress, onAddSubtask }: TimeBlockProps) {
  const done = task.status === 'done';
  const overdue = isOverdue(task, now);
  const range = formatTimeRange(task.startAt, task.dueAt);
  const description = descriptionPreview(task.description);
  const accent = Colors[PRIORITIES[task.priority].dot];

  // The card itself is not a button: the task area and the "Add new subtask…" row are two sibling buttons,
  // because a button inside a button is invalid on the web.
  return (
    <Card padded={false}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${task.name}, ${range}${overdue ? ', overdue' : ''}${done ? ', done' : ''}`}
        onPress={onPress}
        style={({ pressed }) => [styles.stack, styles.padded, pressed && styles.pressed]}>
        <View style={styles.tags}>
          {category ? <CategoryChip name={category.name} color={category.color} /> : null}
          <PriorityChip priority={task.priority} />
        </View>

        <ThemedText variant="headlineSm" color={done ? 'outline' : 'onSurface'} style={done ? styles.struck : undefined}>
          {task.name}
        </ThemedText>

        {description ? (
          <ThemedText variant="bodyMd" color="onSurfaceVariant" numberOfLines={2}>
            {description}
          </ThemedText>
        ) : null}

        <View style={styles.inline}>
          <Icon name="clock" size={14} color={overdue ? 'error' : 'onSurfaceVariant'} />
          <ThemedText variant="labelMd" color={overdue ? 'error' : 'onSurfaceVariant'}>
            {range}
          </ThemedText>
        </View>

        {task.subtaskTotal > 0 ? (
          <View style={styles.inline}>
            <Icon name="checkCircle" size={14} color="secondary" />
            <ThemedText variant="labelMd" color="onSurfaceVariant">
              {`${task.subtaskTotal} ${task.subtaskTotal === 1 ? 'subtask' : 'subtasks'}`}
            </ThemedText>
            <ProgressBar value={progress(task)} color={accent} label={`${task.name} progress`} />
          </View>
        ) : null}
      </Pressable>

      {onAddSubtask ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Add subtask to ${task.name}`}
          onPress={onAddSubtask}
          style={[styles.addSubtask, styles.padded]}>
          <Icon name="add" size={16} color="primary" />
          <ThemedText variant="labelMd" color="primary">
            Add new subtask…
          </ThemedText>
        </Pressable>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: Spacing.sm,
  },
  padded: {
    padding: Spacing.md,
  },
  pressed: {
    opacity: 0.92,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs + 2,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
  },
  struck: {
    textDecorationLine: 'line-through',
  },
  addSubtask: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    minHeight: 32,
    paddingTop: 0,
  },
});
