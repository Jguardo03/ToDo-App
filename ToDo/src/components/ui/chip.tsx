import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { ThemedText } from '@/components/themed-text';
import { Colors, Radius, Spacing, type ThemeColor } from '@/constants/theme';

export type ChipProps = {
  label: string;
  /** Theme tokens for the pill. Defaults to a neutral grey pill. */
  background?: ThemeColor | string;
  foreground?: ThemeColor | string;
  /** Small coloured dot before the label (priority, category). */
  dot?: ThemeColor | string;
  icon?: IconName;
  /** Selectable pills (pickers): `selected` switches to the primary colours. */
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  /** `sm` for badges in cards, `md` for pickers. */
  size?: 'sm' | 'md';
};

const resolve = (value: ThemeColor | string): string => (value in Colors ? Colors[value as ThemeColor] : value);

export function Chip({
  label,
  background = 'surfaceContainerHigh',
  foreground = 'onSurfaceVariant',
  dot,
  icon,
  selected = false,
  onPress,
  disabled,
  size = 'sm',
}: ChipProps) {
  const bg = selected ? Colors.primary : resolve(background);
  const fg = selected ? Colors.onPrimary : resolve(foreground);
  const dotColor = dot ? (selected ? Colors.onPrimary : resolve(dot)) : undefined;

  const content = (
    <View style={[styles.base, size === 'md' ? styles.md : styles.sm, { backgroundColor: bg }]}>
      {dotColor ? <View style={[styles.dot, { backgroundColor: dotColor }]} /> : null}
      {icon ? <Icon name={icon} size={size === 'md' ? 16 : 12} color={selected ? 'onPrimary' : 'onSurfaceVariant'} /> : null}
      <ThemedText variant={size === 'md' ? 'labelMd' : 'labelXs'} style={{ color: fg }}>
        {label}
      </ThemedText>
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => (pressed ? styles.pressed : undefined)}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.xs + 2,
    borderRadius: Radius.full,
  },
  sm: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  md: {
    minHeight: 40,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
  },
  pressed: {
    opacity: 0.75,
  },
});
