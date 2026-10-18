import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { ThemedText } from '@/components/themed-text';
import { Colors, Layout, Radius, Spacing, type ThemeColor } from '@/constants/theme';

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  icon?: IconName;
  /** Greyed out and not selectable (for example a state that is derived, not chosen). */
  disabled?: boolean;
  /** Colours of this option while selected. */
  background?: ThemeColor;
  foreground?: ThemeColor;
};

type SegmentedProps<T extends string> = {
  options: readonly SegmentedOption<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  label: string;
};

/** Row of equal-width choices (mockup: "Lifecycle state"). */
export function Segmented<T extends string>({ options, value, onChange, label }: SegmentedProps<T>) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.row}>
      {options.map((option) => {
        const selected = option.value === value;
        const background = selected ? Colors[option.background ?? 'primary'] : Colors.surfaceContainerLow;
        const foreground = selected ? (option.foreground ?? 'onPrimary') : 'onSurfaceVariant';
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ selected, disabled: !!option.disabled }}
            disabled={option.disabled}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.option,
              { backgroundColor: background },
              option.disabled && !selected && styles.disabled,
              pressed && styles.pressed,
            ]}>
            {option.icon ? <Icon name={option.icon} size={18} color={foreground} /> : null}
            <ThemedText variant="labelMd" color={foreground}>
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  option: {
    flex: 1,
    minHeight: Layout.minTouchTarget + 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radius.md,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
});
