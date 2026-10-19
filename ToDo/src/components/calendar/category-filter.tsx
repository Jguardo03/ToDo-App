import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/themed-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { Category } from '@/domain/types';
import { withAlpha } from '@/utils/colors';

type CategoryFilterProps = {
  categories: readonly Category[];
  /** Tasks on the selected day, per category id. */
  counts: ReadonlyMap<string, number>;
  /** Ids of the categories that are switched off. */
  hidden: ReadonlySet<string>;
  onToggle: (categoryId: string) => void;
};

/** "Filter Category" list for the desktop Calendar: a checkbox and the day's task count per category. */
export function CategoryFilter({ categories, counts, hidden, onToggle }: CategoryFilterProps) {
  const active = categories.filter((category) => !hidden.has(category.id)).length;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <ThemedText variant="headlineSm" accessibilityRole="header">
          Filter Category
        </ThemedText>
        <ThemedText variant="labelXs" color="onSurfaceVariant">
          {`${active} active`}
        </ThemedText>
      </View>

      {categories.length === 0 ? (
        <ThemedText variant="bodyMd" color="onSurfaceVariant">
          No categories yet.
        </ThemedText>
      ) : (
        categories.map((category) => {
          const checked = !hidden.has(category.id);
          const count = counts.get(category.id) ?? 0;
          return (
            <Pressable
              key={category.id}
              accessibilityRole="checkbox"
              accessibilityLabel={`${category.name}, ${count} ${count === 1 ? 'task' : 'tasks'}`}
              accessibilityState={{ checked }}
              onPress={() => onToggle(category.id)}
              style={[styles.row, checked && styles.rowChecked]}>
              <View style={[styles.box, checked ? { backgroundColor: category.color } : styles.boxOff]}>
                {checked ? <Icon name="check" size={14} color="onPrimary" /> : null}
              </View>
              <ThemedText variant="bodyMd" numberOfLines={1} style={styles.name}>
                {category.name}
              </ThemedText>
              <View style={[styles.count, { backgroundColor: withAlpha(category.color, 0.16) }]}>
                <ThemedText variant="labelXs" style={{ color: category.color }}>
                  {String(count)}
                </ThemedText>
              </View>
            </Pressable>
          );
        })
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: 44,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.default,
  },
  rowChecked: {
    backgroundColor: Colors.surfaceContainerLow,
  },
  box: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
  },
  boxOff: {
    borderWidth: 2,
    borderColor: Colors.outlineVariant,
  },
  name: {
    flex: 1,
  },
  count: {
    minWidth: 28,
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.full,
  },
});
