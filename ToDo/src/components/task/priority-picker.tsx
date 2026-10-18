import { StyleSheet, View } from 'react-native';

import { Chip } from '@/components/ui/chip';
import { PRIORITIES, PRIORITY_KEYS } from '@/constants/priorities';
import { Spacing } from '@/constants/theme';
import type { PriorityKey } from '@/domain/types';

type PriorityPickerProps = {
  value: PriorityKey;
  onChange: (value: PriorityKey) => void;
};

/** Low / Medium / High / Urgent as selectable pills. */
export function PriorityPicker({ value, onChange }: PriorityPickerProps) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="Priority" style={styles.row}>
      {PRIORITY_KEYS.map((key) => (
        <Chip
          key={key}
          size="md"
          label={PRIORITIES[key].name}
          dot={PRIORITIES[key].dot}
          selected={key === value}
          onPress={() => onChange(key)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
});
