import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import { Chip } from '@/components/ui/chip';
import { ThemedText } from '@/components/themed-text';
import { Colors, Layout, Spacing } from '@/constants/theme';

type FormLayoutProps = {
  title: string;
  subtitle?: string;
  /** Small pill next to the title ("Draft", "Subtask"). */
  badge?: string;
  /** Left column on desktop; the whole form on phones. Name, description, subtasks. */
  main: ReactNode;
  /** Right column on desktop; below `main` on phones. Date, category, priority. */
  side?: ReactNode;
  /** Cancel and save buttons: top right on desktop, bottom of the page on phones. */
  actions: ReactNode;
};

/**
 * Page frame shared by the task, subtask and category forms (mockups: add_task, add_subtask and their mobile versions).
 * One column on phones; on desktop a header row with the actions, then a wide main column and a narrow side column.
 */
export function FormLayout({ title, subtitle, badge, main, side, actions }: FormLayoutProps) {
  const { width } = useWindowDimensions();
  const desktop = width >= Layout.desktopBreakpoint;

  const header = (
    <View style={[styles.header, desktop && styles.headerDesktop]}>
      <View style={styles.titles}>
        <View style={styles.titleRow}>
          <ThemedText variant={desktop ? 'headlineXl' : 'headlineLg'} accessibilityRole="header">
            {title}
          </ThemedText>
          {badge ? <Chip label={badge} background="primaryFixed" foreground="onPrimaryFixedVariant" /> : null}
        </View>
        {subtitle ? (
          <ThemedText variant="bodyMd" color="onSurfaceVariant">
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {desktop ? <View style={styles.actionsDesktop}>{actions}</View> : null}
    </View>
  );

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={[styles.page, desktop && styles.pageDesktop]}>
        {header}
        <View style={desktop ? styles.columns : styles.column}>
          <View style={[styles.column, desktop && styles.mainDesktop]}>{main}</View>
          {side ? <View style={[styles.column, desktop && styles.sideDesktop]}>{side}</View> : null}
        </View>
        {desktop ? null : <View style={styles.actionsPhone}>{actions}</View>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
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
    padding: Spacing.margin,
  },
  header: {
    gap: Spacing.sm,
  },
  headerDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titles: {
    gap: Spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  actionsDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  actionsPhone: {
    gap: Spacing.md,
  },
  columns: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xl,
  },
  column: {
    gap: Spacing.lg,
  },
  mainDesktop: {
    flex: 2,
  },
  sideDesktop: {
    flex: 1,
  },
});
