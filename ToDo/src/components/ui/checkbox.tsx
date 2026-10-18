import { Pressable, StyleSheet } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Colors, Radius } from '@/constants/theme';

type CheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** What ticking it does, for screen readers (for example "Mark Finalize wireframes done"). */
  label: string;
  /** Colour of the filled box. Defaults to the primary colour. */
  color?: string;
};

/** 24px square, with a 48px touch area (mockup: Checkboxes). */
export function Checkbox({ checked, onChange, label, color = Colors.primary }: CheckboxProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked }}
      hitSlop={12}
      onPress={() => onChange(!checked)}
      style={[styles.box, checked ? { backgroundColor: color } : styles.unchecked]}>
      {checked ? <Icon name="check" size={16} color="onPrimary" /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.default,
  },
  unchecked: {
    backgroundColor: Colors.surfaceContainerHigh,
  },
});
