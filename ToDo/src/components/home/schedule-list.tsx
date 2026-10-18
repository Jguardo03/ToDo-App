import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import type { Category, Task } from '@/domain/types';
import { formatTimeRange } from '@/utils/dates';

type ScheduleListProps = {
  /** Today's tasks. They are shown in order of start time (or due time when there is no start). */
  tasks: readonly Task[];
  categories: ReadonlyMap<string, Pick<Category, 'name'>>;
  now: Date;
};

const startOf = (task: Task) => (task.startAt ?? task.dueAt).getTime();

/** "Today's Schedule" (desktop Home): a timeline of today's tasks with their time ranges. */
export function ScheduleList({ tasks, categories, now }: ScheduleListProps) {
  const ordered = [...tasks].sort((a, b) => startOf(a) - startOf(b));

  return (
    <Card style={styles.stack}>
      <ThemedText variant="headlineSm" accessibilityRole="header">
        Today&apos;s Schedule
      </ThemedText>
      {ordered.length === 0 ? (
        <ThemedText variant="bodyMd" color="onSurfaceVariant">
          Nothing scheduled for today.
        </ThemedText>
      ) : (
        ordered.map((task) => {
          const current = task.status !== 'done' && !!task.startAt && task.startAt <= now && now <= task.dueAt;
          return (
            <View key={task.id} style={styles.row}>
              <View style={[styles.dot, current && styles.dotCurrent]} />
              <View style={styles.text}>
                <View style={styles.time}>
                  <ThemedText variant="labelXs" color={current ? 'primary' : 'onSurfaceVariant'} style={styles.plain}>
                    {formatTimeRange(task.startAt, task.dueAt)}
                  </ThemedText>
                  {current ? <Chip label="Current" background="primaryFixed" foreground="onPrimaryFixedVariant" /> : null}
                </View>
                <ThemedText variant="headlineSm" numberOfLines={1}>
                  {task.name}
                </ThemedText>
                <ThemedText variant="bodySm" color="onSurfaceVariant">
                  {categories.get(task.categoryId)?.name ?? ''}
                </ThemedText>
              </View>
            </View>
          );
        })
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  dot: {
    width: 10,
    height: 10,
    marginTop: 4,
    borderRadius: 5,
    backgroundColor: Colors.outlineVariant,
  },
  dotCurrent: {
    backgroundColor: Colors.primary,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  time: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  plain: {
    textTransform: 'none',
  },
});
