import { StyleSheet, View } from 'react-native';

import { TimeBlock } from '@/components/calendar/time-block';
import { ThemedText } from '@/components/themed-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { timelineTime } from '@/domain/calendar';
import type { Category, Task } from '@/domain/types';
import { formatDuration, formatTime } from '@/utils/dates';

type DayTimelineProps = {
  /** The day's tasks, already in timeline order. */
  tasks: readonly Task[];
  categories: ReadonlyMap<string, Pick<Category, 'name' | 'color'>>;
  now: Date;
  /** Desktop: a dot and line beside the blocks, and an "Add new subtask…" row in each. */
  rail?: boolean;
  onOpenTask: (task: Task) => void;
  onAddSubtask?: (task: Task) => void;
};

/** The selected day as a list of time blocks, each with its start (or due) time on the left. */
export function DayTimeline({ tasks, categories, now, rail, onOpenTask, onAddSubtask }: DayTimelineProps) {
  return (
    <View style={styles.list}>
      {tasks.map((task) => {
        const category = categories.get(task.categoryId);
        const duration = task.startAt ? formatDuration(task.startAt, task.dueAt) : undefined;
        return (
          <View key={task.id} style={styles.row}>
            <View style={styles.time}>
              <ThemedText variant="labelMd" color="onSurfaceVariant">
                {formatTime(timelineTime(task))}
              </ThemedText>
              {duration ? (
                <ThemedText variant="labelXs" color="outline">
                  {duration}
                </ThemedText>
              ) : null}
            </View>
            {rail ? (
              <View style={styles.rail}>
                <View style={[styles.dot, { backgroundColor: category?.color ?? Colors.outlineVariant }]} />
                <View style={styles.line} />
              </View>
            ) : null}
            <View style={styles.block}>
              <TimeBlock
                task={task}
                category={category}
                now={now}
                onPress={() => onOpenTask(task)}
                onAddSubtask={rail && onAddSubtask ? () => onAddSubtask(task) : undefined}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  time: {
    width: 72,
    paddingTop: Spacing.md,
    gap: 2,
  },
  rail: {
    width: 12,
    alignItems: 'center',
    paddingTop: Spacing.lg,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: Radius.full,
  },
  line: {
    flex: 1,
    width: 2,
    marginTop: Spacing.xs,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  block: {
    flex: 1,
  },
});
