import { StyleSheet, View } from 'react-native';

import { Chip } from '@/components/ui/chip';
import { Spacing } from '@/constants/theme';
import type { Category } from '@/domain/types';

type CategoryPickerProps = {
  categories: readonly Pick<Category, 'id' | 'name' | 'color'>[];
  value: string;
  onChange: (categoryId: string) => void;
  /** Shows a "+ New" pill that calls this (opens the category form). */
  onCreate?: () => void;
};

/** Category pills for the task form; exactly one is selected. */
export function CategoryPicker({ categories, value, onChange, onCreate }: CategoryPickerProps) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="Category" style={styles.row}>
      {categories.map((category) => (
        <Chip
          key={category.id}
          size="md"
          label={category.name}
          dot={category.color}
          selected={category.id === value}
          onPress={() => onChange(category.id)}
        />
      ))}
      {onCreate ? <Chip size="md" icon="add" label="New" foreground="primary" background="surfaceContainerLowest" onPress={onCreate} /> : null}
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
