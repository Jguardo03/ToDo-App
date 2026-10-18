import { createElement } from 'react';
import { StyleSheet, View } from 'react-native';

import type { DateTimeFieldProps } from '@/components/ui/date-time-field-props';
import { ThemedText } from '@/components/themed-text';
import { Colors, FontFamily, Layout, Radius, Shadow, Spacing } from '@/constants/theme';
import { parseDateTimeInput, toDateTimeInputValue } from '@/utils/dates';

/** Web: the browser's own date-and-time picker (`<input type="datetime-local">`). */
export function DateTimeField({ label, accessibilityLabel, value, onChange, error }: DateTimeFieldProps) {
  return (
    <View style={styles.group}>
      {label ? <ThemedText variant="labelMd">{label}</ThemedText> : null}
      <View style={[styles.box, error ? styles.invalid : null]}>
        {createElement('input', {
          type: 'datetime-local',
          'aria-label': accessibilityLabel ?? label,
          'aria-invalid': error ? true : undefined,
          value: value ? toDateTimeInputValue(value) : '',
          onChange: (event: { target: { value: string } }) => onChange(parseDateTimeInput(event.target.value)),
          style: inputStyle,
        })}
      </View>
      {error ? (
        <ThemedText variant="bodySm" color="error" accessibilityRole="alert">
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

const inputStyle = {
  width: '100%',
  minHeight: Layout.minTouchTarget,
  boxSizing: 'border-box',
  padding: `0 ${Spacing.md}px`,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  color: Colors.onSurface,
  fontFamily: FontFamily.semibold,
  fontSize: 16,
  cursor: 'pointer',
} as const;

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
  invalid: {
    borderColor: Colors.error,
  },
});
