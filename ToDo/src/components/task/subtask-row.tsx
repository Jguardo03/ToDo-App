import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { isOverdue } from '@/domain/derive';
import type { Subtask } from '@/domain/types';
import { formatRelativeDay, formatTime } from '@/utils/dates';

type SubtaskRowProps = {
  subtask: Subtask;
  now: Date;
  onToggle: (done: boolean) => void;
  onPress?: () => void;
};

/** One line of the subtask list: struck-through when done, with its completion or due time under it. */
export function SubtaskRow({ subtask, now, onToggle, onPress }: SubtaskRowProps) {
  const done = subtask.status === 'done';
  const overdue = isOverdue(subtask, now);
  const detail = done
    ? `Completed ${subtask.completedAt ? formatTime(subtask.completedAt) : ''}`.trim()
    : `${formatRelativeDay(subtask.dueAt, now)} • ${formatTime(subtask.dueAt)}`;

  return (
    <Card onPress={onPress} accessibilityLabel={`${subtask.name}, ${detail}`} style={styles.row}>
      <View style={styles.text}>
        <ThemedText
          variant="headlineSm"
          color={done ? 'outline' : 'onSurface'}
          style={done ? styles.struck : undefined}>
          {subtask.name}
        </ThemedText>
        <View style={styles.detail}>
          <Icon name={done ? 'check' : 'clock'} size={13} color={overdue ? 'error' : done ? 'secondary' : 'onSurfaceVariant'} />
          <ThemedText variant="bodySm" color={overdue ? 'error' : 'onSurfaceVariant'}>
            {detail}
          </ThemedText>
        </View>
      </View>
      <Checkbox
        checked={done}
        onChange={onToggle}
        label={done ? `Mark ${subtask.name} not done` : `Mark ${subtask.name} done`}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
  },
  struck: {
    textDecorationLine: 'line-through',
  },
});
