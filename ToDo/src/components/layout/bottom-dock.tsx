import { Link } from 'expo-router';
import { TabTrigger } from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NAV_ITEMS, NEW_TASK_HREF } from '@/components/layout/nav-items';
import { NavButton } from '@/components/layout/nav-button';
import { ThemedText } from '@/components/themed-text';
import { Colors, Layout, Radius, Spacing } from '@/constants/theme';

/** Phone navigation: three tabs plus the "new task" action (mockups: mobile_*). */
export function BottomDock() {
  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <View style={styles.dock}>
        {NAV_ITEMS.map((item) => (
          <TabTrigger key={item.name} name={item.name} asChild>
            <NavButton placement="dock">{item.label}</NavButton>
          </TabTrigger>
        ))}
        <Link href={NEW_TASK_HREF} asChild>
          <Pressable accessibilityLabel="New task" style={styles.fab}>
            <ThemedText variant="headlineLg" color="onPrimary">
              +
            </ThemedText>
          </Pressable>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    alignItems: 'center',
  },
  dock: {
    width: '100%',
    maxWidth: Layout.mobileMaxWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surfaceContainerLowest,
    boxShadow: '0 4px 16px rgba(27, 27, 33, 0.08)',
  },
  fab: {
    width: Layout.minTouchTarget,
    height: Layout.minTouchTarget,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
});
