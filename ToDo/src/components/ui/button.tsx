import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { ThemedText } from '@/components/themed-text';
import { Colors, Layout, Radius, Spacing, type ThemeColor } from '@/constants/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: ButtonVariant;
  icon?: IconName;
  loading?: boolean;
  /** Stretch to the full width of the parent (primary actions on phones). */
  fullWidth?: boolean;
};

const VARIANTS: Record<ButtonVariant, { background: string; foreground: ThemeColor }> = {
  primary: { background: Colors.primary, foreground: 'onPrimary' },
  secondary: { background: Colors.surfaceContainerHigh, foreground: 'onSurface' },
  ghost: { background: 'transparent', foreground: 'onSurface' },
  danger: { background: Colors.errorContainer, foreground: 'onErrorContainer' },
};

export function Button({
  label,
  variant = 'primary',
  icon,
  loading = false,
  fullWidth = false,
  disabled,
  onPress,
  ...rest
}: ButtonProps) {
  const { background, foreground } = VARIANTS[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      {...rest}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: background },
        fullWidth && styles.fullWidth,
        inactive && styles.disabled,
        pressed && styles.pressed,
      ]}>
      {loading ? (
        <ActivityIndicator color={Colors[foreground]} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={20} color={foreground} /> : null}
          <ThemedText variant="headlineSm" color={foreground}>
            {label}
          </ThemedText>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: Layout.minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.md,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ translateY: 1 }],
  },
});
