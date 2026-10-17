import type { TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Layout, Radius, Spacing } from '@/constants/theme';

type NavButtonProps = TabTriggerSlotProps & {
  /** `dock` = bottom bar on phones, `side` = left navigation on desktop. */
  placement: 'dock' | 'side';
};

/** Rendered by `TabTrigger asChild`, which injects `isFocused` and `onPress`. */
export function NavButton({ children, isFocused, placement, ...props }: NavButtonProps) {
  const label = typeof children === 'string' ? children : undefined;

  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!isFocused }}
      style={({ pressed }) => [
        styles.base,
        placement === 'side' ? styles.side : styles.dock,
        placement === 'side' && isFocused && styles.sideActive,
        pressed && styles.pressed,
      ]}>
      <ThemedText
        variant="labelMd"
        color={placement === 'side' && isFocused ? 'onPrimary' : isFocused ? 'primary' : 'onSurfaceVariant'}>
        {children}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: Layout.minTouchTarget,
    justifyContent: 'center',
  },
  dock: {
    flex: 1,
    alignItems: 'center',
  },
  side: {
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.default,
  },
  sideActive: {
    backgroundColor: Colors.primaryContainer,
  },
  pressed: {
    opacity: 0.7,
  },
});
