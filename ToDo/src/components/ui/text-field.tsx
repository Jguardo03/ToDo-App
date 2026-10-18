import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { ThemedText } from '@/components/themed-text';
import { Colors, FontFamily, Layout, Radius, Shadow, Spacing } from '@/constants/theme';

type BaseProps = Omit<TextInputProps, 'style' | 'onChange' | 'value' | 'onChangeText'> & {
  value: string;
  onChangeText: (value: string) => void;
  /** Visible label above the field. Without it the field uses `accessibilityLabel` only. */
  label?: string;
  /** Message under the field; also marks it invalid for screen readers. */
  error?: string;
};

type TextFieldProps = BaseProps & {
  /** Icon at the right edge (for example a pencil). */
  icon?: IconName;
  /** Fixed text before the input, such as "@" for a username. */
  prefix?: string;
};

type TextAreaProps = BaseProps & {
  /** Small hint at the bottom right, such as "Markdown ok". */
  hint?: string;
  rows?: number;
};

export function TextField({ label, error, icon, prefix, value, onChangeText, ...rest }: TextFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.group}>
      {label ? <ThemedText variant="labelMd">{label}</ThemedText> : null}
      <View style={[styles.box, styles.row, focused && styles.focused, error ? styles.invalid : null]}>
        {prefix ? (
          <ThemedText variant="headlineSm" color="outline" style={styles.prefix}>
            {prefix}
          </ThemedText>
        ) : null}
        <TextInput
          {...rest}
          accessibilityLabel={rest.accessibilityLabel ?? label}
          accessibilityHint={error}
          placeholderTextColor={Colors.outlineVariant}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.input}
        />
        {icon ? <Icon name={icon} size={20} color={focused ? 'primary' : 'outline'} /> : null}
      </View>
      {error ? (
        <ThemedText variant="bodySm" color="error" accessibilityRole="alert">
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

export function TextArea({ label, error, hint, rows = 4, value, onChangeText, ...rest }: TextAreaProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.group}>
      {label ? <ThemedText variant="labelMd">{label}</ThemedText> : null}
      <View style={[styles.box, focused && styles.focused, error ? styles.invalid : null]}>
        <TextInput
          {...rest}
          multiline
          numberOfLines={rows}
          textAlignVertical="top"
          accessibilityLabel={rest.accessibilityLabel ?? label}
          accessibilityHint={error}
          placeholderTextColor={Colors.outlineVariant}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.input, styles.area, { minHeight: rows * 22 + Spacing.lg }]}
        />
        {hint ? (
          <View style={styles.footer}>
            <ThemedText variant="labelXs" color="outline" style={styles.hint}>
              {hint}
            </ThemedText>
          </View>
        ) : null}
      </View>
      {error ? (
        <ThemedText variant="bodySm" color="error" accessibilityRole="alert">
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: Spacing.xs + 2,
  },
  box: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.md,
    boxShadow: Shadow.card,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: Spacing.md,
  },
  focused: {
    borderColor: Colors.secondaryContainer,
  },
  invalid: {
    borderColor: Colors.error,
  },
  input: {
    flex: 1,
    minHeight: Layout.minTouchTarget,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.onSurface,
    fontFamily: FontFamily.regular,
    fontSize: 16,
    outlineWidth: 0,
  },
  area: {
    paddingTop: Spacing.md,
  },
  prefix: {
    paddingLeft: Spacing.md,
  },
  footer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'flex-end',
  },
  hint: {
    textTransform: 'none',
  },
});
