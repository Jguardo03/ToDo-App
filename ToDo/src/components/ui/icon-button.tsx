import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { Colors, Layout, Radius, Shadow, type ThemeColor } from '@/constants/theme';

type IconButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  icon: IconName;
  /** Required: an icon alone has no text for screen readers. */
  label: string;
  color?: ThemeColor;
  /** White tile with a soft shadow (header actions) or no background (inline). */
  tile?: boolean;
};

export function IconButton({ icon, label, color = 'onSurface', tile = true, ...rest }: IconButtonProps) {
  return (
    <Pressable
      {...rest}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      style={({ pressed }) => [styles.base, tile && styles.tile, pressed && styles.pressed]}>
      <Icon name={icon} size={20} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: Layout.minTouchTarget - 8,
    height: Layout.minTouchTarget - 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
  },
  tile: {
    backgroundColor: Colors.surfaceContainerLowest,
    boxShadow: Shadow.card,
  },
  pressed: {
    opacity: 0.7,
  },
});
