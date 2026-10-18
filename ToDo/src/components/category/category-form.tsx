import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { TextArea, TextField } from '@/components/ui/text-field';
import { ThemedText } from '@/components/themed-text';
import { CATEGORY_COLORS, DEFAULT_CATEGORY_COLOR } from '@/constants/category-colors';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { NewCategory } from '@/domain/types';
import { validateNewCategory, type FieldErrors } from '@/domain/validation';

type CategoryFormProps = {
  initial?: Partial<NewCategory>;
  submitLabel?: string;
  busy?: boolean;
  onSubmit: (input: NewCategory) => void | Promise<void>;
  onCancel?: () => void;
};

/** Create or edit a category: name, description and a colour. Meant to sit in a `BottomSheet` or a page. */
export function CategoryForm({ initial, submitLabel = 'Create Category', busy, onSubmit, onCancel }: CategoryFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [color, setColor] = useState<string>(initial?.color ?? DEFAULT_CATEGORY_COLOR);
  const [errors, setErrors] = useState<FieldErrors<NewCategory>>({});

  const submit = () => {
    const input: NewCategory = { name: name.trim(), description, color };
    const result = validateNewCategory(input);
    setErrors(result.ok ? {} : result.errors);
    if (result.ok) void onSubmit(input);
  };

  return (
    <View style={styles.form}>
      <TextField label="Name" value={name} onChangeText={setName} placeholder="Design" error={errors.name} />
      <TextArea
        label="Description"
        rows={2}
        value={description}
        onChangeText={setDescription}
        placeholder="What belongs here?"
        error={errors.description}
      />

      <View style={styles.colors}>
        <ThemedText variant="labelMd">Colour</ThemedText>
        <View accessibilityRole="radiogroup" accessibilityLabel="Colour" style={styles.swatches}>
          {CATEGORY_COLORS.map((swatch) => (
            <Pressable
              key={swatch}
              accessibilityRole="radio"
              accessibilityLabel={`Colour ${swatch}`}
              accessibilityState={{ selected: swatch === color }}
              onPress={() => setColor(swatch)}
              style={[styles.swatch, { backgroundColor: swatch }]}>
              {swatch === color ? <Icon name="check" size={20} color="onPrimary" /> : null}
            </Pressable>
          ))}
        </View>
        {errors.color ? (
          <ThemedText variant="bodySm" color="error" accessibilityRole="alert">
            {errors.color}
          </ThemedText>
        ) : null}
      </View>

      <View style={styles.actions}>
        {onCancel ? <Button label="Cancel" variant="secondary" onPress={onCancel} /> : null}
        <Button label={submitLabel} icon="check" loading={busy} onPress={submit} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.lg,
  },
  colors: {
    gap: Spacing.sm,
  },
  swatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  swatch: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: Colors.surfaceContainerLowest,
  },
  actions: {
    gap: Spacing.md,
  },
});
