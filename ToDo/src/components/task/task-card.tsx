import { StyleSheet, View } from 'react-native';

import { CategoryChip } from '@/components/category/category-chip';
import { PriorityChip } from '@/components/task/priority-chip';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Icon } from '@/components/ui/icon';
import { ProgressBar } from '@/components/ui/progress-bar';
import { ProgressRing } from '@/components/ui/progress-ring';
import { ThemedText } from '@/components/themed-text';
import { PRIORITIES } from '@/constants/priorities';
import { Colors, Spacing } from '@/constants/theme';
import { isOverdue, progress, progressPercent } from '@/domain/derive';
import type { Category, Task } from '@/domain/types';
import { formatDueLabel } from '@/utils/dates';

export type TaskCardVariant = 'row' | 'category' | 'status';

type TaskCardProps = {
  task: Task;
  /** The task's category, for the subtitle / chip. */
  category?: Pick<Category, 'name' | 'color'>;
  /** The current time, passed in so the card is a pure function of its props. */
  now: Date;
  /**
   * - `row`: Home list (checkbox, title, due time, progress ring)
   * - `category`: category detail (priority + due, progress bar)
   * - `status`: status detail (priority stripe, category and priority chips, percent)
   */
  variant?: TaskCardVariant;
  onPress?: () => void;
  /** Called with the new done state when the checkbox is toggled. Omit to hide the checkbox. */
  onToggleDone?: (done: boolean) => void;
};

export function TaskCard({ task, category, now, variant = 'row', onPress, onToggleDone }: TaskCardProps) {
  const done = task.status === 'done';
  const overdue = isOverdue(task, now);
  const accent = Colors[PRIORITIES[task.priority].dot];
  const dueLabel = formatDueLabel(task.dueAt, now);
  const percent = progressPercent(task);

  const checkbox = onToggleDone ? (
    <Checkbox
      checked={done}
      onChange={onToggleDone}
      label={done ? `Mark ${task.name} not done` : `Mark ${task.name} done`}
      color={accent}
    />
  ) : null;

  const title = (
    <ThemedText
      variant="headlineSm"
      color={done ? 'outline' : 'onSurface'}
      numberOfLines={variant === 'row' ? 1 : 2}
      style={done ? styles.struck : undefined}>
      {task.name}
    </ThemedText>
  );

  const due = (
    <View style={styles.inline}>
      <Icon name="clock" size={13} color={overdue ? 'error' : 'onSurfaceVariant'} />
      <ThemedText variant="labelXs" color={overdue ? 'error' : 'onSurfaceVariant'} style={styles.plain}>
        {dueLabel}
      </ThemedText>
    </View>
  );

  const label = `${task.name}, ${dueLabel}${overdue ? ', overdue' : ''}, ${percent}% complete`;

  if (variant === 'category') {
    return (
      <Card onPress={onPress} accessibilityLabel={label} style={styles.stack}>
        <View style={styles.spread}>
          <View style={styles.inline}>
            <PriorityChip priority={task.priority} />
            {due}
          </View>
          {checkbox}
        </View>
        {title}
        <View style={styles.inline}>
          <ProgressBar value={progress(task)} color={accent} label={`${task.name} progress`} />
          <ThemedText variant="labelXs" color="onSurfaceVariant" style={styles.plain}>
            {`${percent}%`}
          </ThemedText>
        </View>
      </Card>
    );
  }

  if (variant === 'status') {
    return (
      <Card accent={accent} onPress={onPress} accessibilityLabel={label} style={styles.stack}>
        <View style={styles.spread}>
          <View style={[styles.inline, styles.wrap]}>
            {category ? <CategoryChip name={category.name} color={category.color} /> : null}
            <PriorityChip priority={task.priority} />
            <ThemedText variant="labelXs" color="onSurfaceVariant" style={styles.plain}>
              {`• ${percent}%`}
            </ThemedText>
          </View>
          {checkbox}
        </View>
        {title}
        {due}
      </Card>
    );
  }

  return (
    <Card onPress={onPress} accessibilityLabel={label} style={styles.row}>
      {checkbox}
      <View style={styles.grow}>
        {title}
        <View style={[styles.inline, styles.wrap]}>
          {category ? (
            <>
              <ThemedText variant="bodySm" color="onSurfaceVariant" numberOfLines={1}>
                {category.name}
              </ThemedText>
              <View style={styles.separator} />
            </>
          ) : null}
          {due}
        </View>
      </View>
      <ProgressRing value={progress(task)} color={accent} label={`${task.name} progress`} />
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  stack: {
    gap: Spacing.sm,
  },
  spread: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
  },
  wrap: {
    flexWrap: 'wrap',
  },
  grow: {
    flex: 1,
    gap: 2,
  },
  separator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.outlineVariant,
  },
  struck: {
    textDecorationLine: 'line-through',
  },
  plain: {
    textTransform: 'none',
  },
});
