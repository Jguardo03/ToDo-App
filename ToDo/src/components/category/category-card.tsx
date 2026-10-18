import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { ProgressBar } from '@/components/ui/progress-bar';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import type { Category } from '@/domain/types';
import { withAlpha } from '@/utils/colors';

type CategoryCardProps = {
  category: Pick<Category, 'name' | 'color'>;
  taskCount: number;
  /** Done tasks out of `taskCount`. When given (and there are tasks), the card shows a progress bar. */
  doneCount?: number;
  onPress?: () => void;
};

/** Tile in the Categories grid: colour stroke, icon badge, name and task count (mockups: categories). */
export function CategoryCard({ category, taskCount, doneCount, onPress }: CategoryCardProps) {
  const tasks = `${taskCount} ${taskCount === 1 ? 'Task' : 'Tasks'}`;
  const showProgress = doneCount !== undefined && taskCount > 0;

  return (
    <Card accent={category.color} onPress={onPress} accessibilityLabel={`${category.name}, ${tasks}`} style={styles.card}>
      <View style={[styles.badge, { backgroundColor: withAlpha(category.color, 0.14) }]}>
        <Icon name="folder" size={32} color="onSurface" />
      </View>
      <View style={styles.footer}>
        <View style={styles.text}>
          <ThemedText variant="headlineSm" style={{ color: category.color }} numberOfLines={1}>
            {category.name}
          </ThemedText>
          <ThemedText variant="bodySm" color="onSurfaceVariant">
            {tasks}
          </ThemedText>
        </View>
        <Icon name="forward" size={18} color="onSurfaceVariant" />
      </View>
      {showProgress ? (
        <View style={styles.progress}>
          <ProgressBar value={(doneCount ?? 0) / taskCount} color={category.color} label={`${category.name} progress`} />
          <ThemedText variant="labelXs" color="onSurfaceVariant" style={styles.plain}>
            {`${doneCount} / ${taskCount} Done`}
          </ThemedText>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 160,
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  badge: {
    width: 64,
    height: 64,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  text: {
    flex: 1,
  },
  progress: {
    gap: Spacing.xs,
  },
  plain: {
    textTransform: 'none',
  },
});
