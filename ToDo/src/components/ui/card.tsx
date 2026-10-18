import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';

type CardProps = {
  children: ReactNode;
  onPress?: () => void;
  /** Label read by screen readers when the whole card is pressable. */
  accessibilityLabel?: string;
  /** Colour of the 3px stroke on the left edge (priority or category). */
  accent?: string;
  /** Tinted panel (stats, form side cards) instead of white. */
  tone?: 'default' | 'muted';
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** White rounded surface with a soft shadow. Pressable when `onPress` is given. */
export function Card({ children, onPress, accessibilityLabel, accent, tone = 'default', padded = true, style }: CardProps) {
  const body = (
    <View
      style={[
        styles.base,
        tone === 'muted' && styles.muted,
        padded && styles.padded,
        accent ? { borderLeftWidth: 3, borderLeftColor: accent } : null,
        style,
      ]}>
      {children}
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => (pressed ? styles.pressed : undefined)}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.md,
    boxShadow: Shadow.card,
    overflow: 'hidden',
  },
  muted: {
    backgroundColor: Colors.surfaceContainerLow,
    boxShadow: 'none',
  },
  padded: {
    padding: Spacing.md,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
});
