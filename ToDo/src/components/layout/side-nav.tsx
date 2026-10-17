import { Link } from 'expo-router';
import { TabTrigger } from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NAV_ITEMS, NEW_TASK_HREF } from '@/components/layout/nav-items';
import { NavButton } from '@/components/layout/nav-button';
import { ThemedText } from '@/components/themed-text';
import { Colors, Layout, Radius, Spacing } from '@/constants/theme';

/** Desktop navigation (mockups: home, calendar, categories). The user footer arrives with the session in Phase 6. */
export function SideNav() {
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      <ThemedText variant="headlineSm" color="primary">
        ToDo
      </ThemedText>

      <Link href={NEW_TASK_HREF} asChild>
        <Pressable accessibilityLabel="New task" style={styles.newTask}>
          <ThemedText variant="labelMd" color="onPrimary">
            + New Task
          </ThemedText>
        </Pressable>
      </Link>

      <View style={styles.items}>
        {NAV_ITEMS.map((item) => (
          <TabTrigger key={item.name} name={item.name} asChild>
            <NavButton placement="side">{item.label}</NavButton>
          </TabTrigger>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: Layout.sideNavWidth,
    padding: Spacing.xl,
    gap: Spacing.lg,
    backgroundColor: Colors.surfaceContainerLow,
  },
  newTask: {
    minHeight: Layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.default,
    backgroundColor: Colors.primary,
  },
  items: {
    gap: Spacing.xs,
  },
});
