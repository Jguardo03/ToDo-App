import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryFilter } from '@/components/calendar/category-filter';
import { DayTimeline } from '@/components/calendar/day-timeline';
import { MiniMonth } from '@/components/calendar/mini-month';
import { WeekStrip } from '@/components/calendar/week-strip';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorBanner } from '@/components/ui/error-banner';
import { IconButton } from '@/components/ui/icon-button';
import { ThemedText } from '@/components/themed-text';
import { Colors, Layout, Radius, Spacing } from '@/constants/theme';
import { countByCategory, daysWithTasks, excludeCategories, tasksOnDay } from '@/domain/calendar';
import type { Category, Task } from '@/domain/types';
import { addDays, addMonths, formatLongDate, isSameDay, isoWeekNumber, startOfDay, weekDays } from '@/utils/dates';

type CalendarContentProps = {
  now: Date;
  tasks: readonly Task[];
  categories: readonly Category[];
  loading?: boolean;
  /** A message when loading failed. */
  error?: string;
  onOpenTask: (task: Task) => void;
  onAddSubtask: (task: Task) => void;
  /** Opens the new-task form for `day` ("Fast Book" and "Schedule a Task"). */
  onAddTask: (day: Date) => void;
};

const NONE: ReadonlySet<string> = new Set();

/** The Calendar screen (mockups: mobile_calendar, calendar, mobile_calendar_empty_stage). Pure: data and actions are props. */
export function CalendarContent({ now, tasks, categories, loading, error, onOpenTask, onAddSubtask, onAddTask }: CalendarContentProps) {
  const { width } = useWindowDimensions();
  const desktop = width >= Layout.desktopBreakpoint;
  const today = startOfDay(now);
  const [selected, setSelected] = useState(today);
  const [monthCursor, setMonthCursor] = useState(today);
  const [hidden, setHidden] = useState<ReadonlySet<string>>(NONE);

  const select = (day: Date) => {
    setSelected(startOfDay(day));
    setMonthCursor(startOfDay(day));
  };

  // The category filter only exists on desktop, so it must not hide tasks on a phone.
  const hiddenNow = desktop ? hidden : NONE;
  const categoryById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);
  const dayTasks = useMemo(() => tasksOnDay(tasks, selected), [tasks, selected]);
  const counts = useMemo(() => countByCategory(dayTasks), [dayTasks]);
  const shown = useMemo(() => excludeCategories(dayTasks, hiddenNow), [dayTasks, hiddenNow]);
  const markedDays = useMemo(() => daysWithTasks(excludeCategories(tasks, hiddenNow)), [tasks, hiddenNow]);

  const toggleCategory = (categoryId: string) =>
    setHidden((current) => {
      const next = new Set(current);
      if (!next.delete(categoryId)) next.add(categoryId);
      return next;
    });

  const header = (
    <View style={styles.header}>
      <IconButton icon="chevronLeft" label="Previous week" onPress={() => select(addDays(selected, -7))} />
      <View style={styles.titles}>
        <ThemedText variant="headlineLg" accessibilityRole="header" style={styles.centered}>
          {formatLongDate(selected)}
        </ThemedText>
        <View style={styles.subtitle}>
          <ThemedText variant="labelXs" color="onSurfaceVariant">
            {`Week ${isoWeekNumber(selected)}`}
          </ThemedText>
          {!isSameDay(selected, today) ? <Chip icon="calendar" label="Today" onPress={() => select(today)} /> : null}
        </View>
      </View>
      <IconButton icon="chevronRight" label="Next week" onPress={() => select(addDays(selected, 7))} />
      {desktop ? <Button label="Fast Book" icon="bolt" onPress={() => onAddTask(selected)} /> : null}
    </View>
  );

  const timeline = loading ? (
    <ActivityIndicator accessibilityLabel="Loading tasks" color={Colors.primary} />
  ) : dayTasks.length === 0 ? (
    <View style={styles.empty}>
      <EmptyState
        icon="calendar"
        title="Nothing on the Agenda"
        message={`Your schedule for ${formatLongDate(selected)} is wide open. Enjoy the uninterrupted focus time, or schedule an upcoming milestone.`}>
        <Button label="Schedule a Task" icon="newTask" onPress={() => onAddTask(selected)} />
      </EmptyState>
    </View>
  ) : shown.length === 0 ? (
    <ThemedText variant="bodyMd" color="onSurfaceVariant">
      No tasks match the category filter.
    </ThemedText>
  ) : (
    <DayTimeline
      tasks={shown}
      categories={categoryById}
      now={now}
      rail={desktop}
      onOpenTask={onOpenTask}
      onAddSubtask={onAddSubtask}
    />
  );

  const strip = (
    <WeekStrip days={weekDays(selected)} selected={selected} today={today} markedDays={markedDays} onSelect={select} />
  );

  return (
    <SafeAreaView edges={desktop ? ['top'] : []} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.page, desktop && styles.pageDesktop]}>
          {header}
          {error ? <ErrorBanner message={error} /> : null}
          {desktop ? (
            <View style={styles.columns}>
              <View style={styles.mainColumn}>
                {strip}
                {timeline}
              </View>
              <View style={styles.sideColumn}>
                <MiniMonth
                  month={monthCursor}
                  selected={selected}
                  today={today}
                  markedDays={markedDays}
                  onSelect={select}
                  onMonthChange={(direction) => setMonthCursor((cursor) => addMonths(cursor, direction))}
                />
                <CategoryFilter categories={categories} counts={counts} hidden={hidden} onToggle={toggleCategory} />
              </View>
            </View>
          ) : (
            <>
              {strip}
              {timeline}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    padding: Spacing.margin,
  },
  page: {
    width: '100%',
    maxWidth: Layout.mobileMaxWidth,
    gap: Spacing.lg,
  },
  pageDesktop: {
    maxWidth: Layout.contentMaxWidth,
    gap: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  titles: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  centered: {
    textAlign: 'center',
  },
  subtitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  columns: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xl,
  },
  mainColumn: {
    flex: 2,
    gap: Spacing.lg,
  },
  sideColumn: {
    flex: 1,
    gap: Spacing.lg,
  },
  empty: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
});
