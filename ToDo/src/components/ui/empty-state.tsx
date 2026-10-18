import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { ThemedText } from '@/components/themed-text';
import { Colors, Radius, Spacing } from '@/constants/theme';

type EmptyStateProps = {
  icon: IconName;
  title: string;
  message: string;
  /** Call to action, usually a `Button`. */
  children?: ReactNode;
};

/** "Nothing here yet" panel (mockups: *_empty_stage). */
export function EmptyState({ icon, title, message, children }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Icon name={icon} size={36} color="primary" />
      </View>
      <ThemedText variant="headlineLg" style={styles.centered} accessibilityRole="header">
        {title}
      </ThemedText>
      <ThemedText variant="bodyMd" color="onSurfaceVariant" style={styles.centered}>
        {message}
      </ThemedText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  badge: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryFixed,
  },
  centered: {
    textAlign: 'center',
  },
});
