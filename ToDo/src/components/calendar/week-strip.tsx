import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { WEEKDAY_SHORT, formatLongDate, isSameDay, toDayKey } from '@/utils/dates';

type WeekStripProps = {
  /** The seven days to show, Monday first. */
  days: readonly Date[];
  selected: Date;
  today: Date;
  /** Day keys (`YYYY-MM-DD`) that have tasks; those days get a dot. */
  markedDays: ReadonlySet<string>;
  onSelect: (day: Date) => void;
};

/** Seven day buttons for the week (mockups: mobile_calendar, calendar). */
export function WeekStrip({ days, selected, today, markedDays, onSelect }: WeekStripProps) {
  return (
    <View style={styles.strip} accessibilityRole="toolbar" accessibilityLabel="Week">
      {days.map((day, index) => {
        const isSelected = isSameDay(day, selected);
        const isToday = isSameDay(day, today);
        const marked = markedDays.has(toDayKey(day));
        const label = `${formatLongDate(day)}${isToday ? ', today' : ''}${marked ? ', has tasks' : ''}`;
        return (
          <Pressable
            key={toDayKey(day)}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(day)}
            style={[styles.day, isSelected && styles.selected]}>
            <ThemedText variant="labelXs" color={isSelected ? 'onPrimary' : 'onSurfaceVariant'}>
              {WEEKDAY_SHORT[index]}
            </ThemedText>
            <ThemedText variant="headlineSm" color={isSelected ? 'onPrimary' : isToday ? 'primary' : 'onSurface'}>
              {String(day.getDate())}
            </ThemedText>
            <View style={[styles.dot, marked && { backgroundColor: isSelected ? Colors.onPrimary : Colors.primary }]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    gap: Spacing.xs,
    padding: Spacing.xs,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceContainerLow,
  },
  day: {
    flex: 1,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: Radius.md,
  },
  selected: {
    backgroundColor: Colors.primary,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
