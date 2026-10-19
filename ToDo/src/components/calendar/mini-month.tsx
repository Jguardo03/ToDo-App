import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { IconButton } from '@/components/ui/icon-button';
import { ThemedText } from '@/components/themed-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { WEEKDAY_INITIALS, formatLongDate, formatMonthYear, isSameDay, monthGrid, toDayKey } from '@/utils/dates';

type MiniMonthProps = {
  /** Any day in the month to show. */
  month: Date;
  selected: Date;
  today: Date;
  /** Day keys (`YYYY-MM-DD`) that have tasks; those days get a dot. */
  markedDays: ReadonlySet<string>;
  onSelect: (day: Date) => void;
  /** -1 for the previous month, 1 for the next. */
  onMonthChange: (direction: -1 | 1) => void;
};

/** Month picker for the desktop Calendar: a dot under each day that has tasks. */
export function MiniMonth({ month, selected, today, markedDays, onSelect, onMonthChange }: MiniMonthProps) {
  const weeks = monthGrid(month);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <ThemedText variant="headlineSm" accessibilityRole="header">
          {formatMonthYear(month)}
        </ThemedText>
        <View style={styles.arrows}>
          <IconButton tile={false} icon="chevronLeft" label="Previous month" onPress={() => onMonthChange(-1)} />
          <IconButton tile={false} icon="chevronRight" label="Next month" onPress={() => onMonthChange(1)} />
        </View>
      </View>

      <View style={styles.row}>
        {WEEKDAY_INITIALS.map((initial, index) => (
          <View key={index} style={styles.cell}>
            <ThemedText variant="labelXs" color="onSurfaceVariant">
              {initial}
            </ThemedText>
          </View>
        ))}
      </View>

      {weeks.map((week) => (
        <View key={toDayKey(week[0])} style={styles.row}>
          {week.map((day) => {
            const inMonth = day.getMonth() === month.getMonth();
            const isSelected = isSameDay(day, selected);
            const isToday = isSameDay(day, today);
            const marked = markedDays.has(toDayKey(day));
            return (
              <Pressable
                key={toDayKey(day)}
                accessibilityRole="button"
                accessibilityLabel={`${formatLongDate(day)}${marked ? ', has tasks' : ''}`}
                accessibilityState={{ selected: isSelected }}
                onPress={() => onSelect(day)}
                style={[styles.cell, styles.day, isSelected && styles.selected]}>
                <ThemedText
                  variant="bodyMd"
                  color={isSelected ? 'onPrimary' : isToday ? 'primary' : inMonth ? 'onSurface' : 'outlineVariant'}>
                  {String(day.getDate())}
                </ThemedText>
                <View style={[styles.dot, marked && { backgroundColor: isSelected ? Colors.onPrimary : Colors.primary }]} />
              </Pressable>
            );
          })}
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  arrows: {
    flexDirection: 'row',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: {
    minHeight: 40,
    borderRadius: Radius.default,
  },
  selected: {
    backgroundColor: Colors.primary,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
