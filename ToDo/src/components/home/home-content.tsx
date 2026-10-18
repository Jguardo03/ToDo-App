import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScheduleList } from '@/components/home/schedule-list';
import { StatCard } from '@/components/home/stat-card';
import { QuickAddCard } from '@/components/task/quick-add-card';
import { TaskCard } from '@/components/task/task-card';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorBanner } from '@/components/ui/error-banner';
import { ThemedText } from '@/components/themed-text';
import { Colors, Layout, Radius, Spacing } from '@/constants/theme';
import { completionRate, countRemaining, selectDueToday, sortByPriority, statusCounts } from '@/domain/derive';
import type { Category, DisplayStatusKey, NewTask, Task } from '@/domain/types';
import { formatLongDate } from '@/utils/dates';

type HomeContentProps = {
  now: Date;
  tasks: readonly Task[];
  categories: readonly Category[];
  loading?: boolean;
  /** A message when loading failed. */
  error?: string;
  onToggleDone: (task: Task, done: boolean) => void;
  onQuickAdd: (task: NewTask) => void | Promise<void>;
  onAddTask: () => void;
  onBrowseCategories: () => void;
  onOpenStatus: (status: DisplayStatusKey) => void;
};

const STAT_ORDER: { status: DisplayStatusKey; caption: string }[] = [
  { status: 'overdue', caption: 'Tasks' },
  { status: 'in_process', caption: 'Active' },
  { status: 'done', caption: 'Done' },
  { status: 'pending', caption: 'Queued' },
];

/** The Home screen (mockups: mobile_home, home, mobile_home_empty_stage). Pure: data and actions come in as props. */
export function HomeContent({
  now,
  tasks,
  categories,
  loading,
  error,
  onToggleDone,
  onQuickAdd,
  onAddTask,
  onBrowseCategories,
  onOpenStatus,
}: HomeContentProps) {
  const { width } = useWindowDimensions();
  const desktop = width >= Layout.desktopBreakpoint;
  const [byPriority, setByPriority] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const dueToday = useMemo(() => selectDueToday(tasks, now), [tasks, now]);
  const counts = useMemo(() => statusCounts(tasks, now), [tasks, now]);
  const remaining = countRemaining(dueToday);

  const visible = useMemo(() => {
    const filtered = categoryFilter ? dueToday.filter((task) => task.categoryId === categoryFilter) : dueToday;
    return byPriority ? sortByPriority(filtered) : filtered;
  }, [dueToday, categoryFilter, byPriority]);

  const remainingText = remaining === 0 ? 'All caught up!' : `${remaining} ${remaining === 1 ? 'task' : 'tasks'} remaining`;
  const captions: Record<DisplayStatusKey, string> = {
    overdue: 'Tasks',
    in_process: 'Active',
    done: desktop && tasks.length > 0 ? `${completionRate(tasks)}% completion rate` : 'Done',
    pending: 'Queued',
  };

  const list = (
    <View style={styles.stack}>
      <View style={styles.listHeader}>
        <View style={styles.inline}>
          <ThemedText variant="headlineLg" accessibilityRole="header">
            Due Today
          </ThemedText>
          <Chip label={`${dueToday.length} ${dueToday.length === 1 ? 'Task' : 'Tasks'}`} />
        </View>
      </View>

      {desktop && dueToday.length > 0 ? (
        <View style={[styles.inline, styles.wrap]}>
          <Chip size="md" icon="filter" label="Priority" selected={byPriority} onPress={() => setByPriority((on) => !on)} />
          <Chip
            size="md"
            label="All Categories"
            selected={categoryFilter === null}
            onPress={() => setCategoryFilter(null)}
          />
          {categories.map((category) => (
            <Chip
              key={category.id}
              size="md"
              label={category.name}
              dot={category.color}
              selected={categoryFilter === category.id}
              onPress={() => setCategoryFilter(category.id)}
            />
          ))}
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator accessibilityLabel="Loading tasks" color={Colors.primary} />
      ) : dueToday.length === 0 ? (
        <View style={styles.empty}>
          <EmptyState
            icon="done"
            title="Clear Skies Ahead!"
            message="You're completely caught up. Take a breather, review your calendar, or plan what's next.">
            <Button label="Add First Task" icon="newTask" onPress={onAddTask} />
            <Button label="Or browse categories to organize projects" variant="ghost" icon="folder" onPress={onBrowseCategories} />
          </EmptyState>
        </View>
      ) : visible.length === 0 ? (
        <ThemedText variant="bodyMd" color="onSurfaceVariant">
          No tasks match this filter.
        </ThemedText>
      ) : (
        visible.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            category={categoryById.get(task.categoryId)}
            now={now}
            onToggleDone={(done) => onToggleDone(task, done)}
          />
        ))
      )}
    </View>
  );

  return (
    <SafeAreaView edges={desktop ? ['top'] : []} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.page, desktop && styles.pageDesktop]}>
          <View style={styles.stack}>
            <View style={styles.eyebrow}>
              <View style={styles.inline}>
                <View style={styles.dot} />
                <ThemedText variant="labelXs" color="secondary">
                  Today
                </ThemedText>
              </View>
              <Chip icon="done" label={`${remaining} remaining`} />
            </View>
            <ThemedText variant="headlineXl" accessibilityRole="header">
              Today&apos;s Focus
            </ThemedText>
            <ThemedText variant="bodyMd" color="onSurfaceVariant">
              {`${formatLongDate(now)} • ${remainingText}`}
            </ThemedText>
          </View>

          {error ? <ErrorBanner message={error} /> : null}

          <View style={[styles.stats, desktop && styles.statsDesktop]}>
            {STAT_ORDER.map(({ status }) => (
              <View key={status} style={desktop ? styles.statDesktop : styles.stat}>
                <StatCard
                  status={status}
                  value={counts[status]}
                  caption={captions[status]}
                  onPress={() => onOpenStatus(status)}
                />
              </View>
            ))}
          </View>

          {desktop ? (
            <View style={styles.columns}>
              <View style={styles.mainColumn}>{list}</View>
              <View style={styles.sideColumn}>
                <QuickAddCard categories={categories} now={now} onSubmit={onQuickAdd} />
                <ScheduleList tasks={dueToday} categories={categoryById} now={now} />
              </View>
            </View>
          ) : (
            list
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
    gap: Spacing.xl,
  },
  pageDesktop: {
    maxWidth: Layout.contentMaxWidth,
  },
  stack: {
    gap: Spacing.md,
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  wrap: {
    flexWrap: 'wrap',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: Radius.full,
    backgroundColor: Colors.secondaryContainer,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.gutter,
  },
  statsDesktop: {
    flexWrap: 'nowrap',
  },
  stat: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  statDesktop: {
    flex: 1,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  empty: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  columns: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xl,
  },
  mainColumn: {
    flex: 2,
  },
  sideColumn: {
    flex: 1,
    gap: Spacing.lg,
  },
});
