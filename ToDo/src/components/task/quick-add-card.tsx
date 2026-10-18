import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CategoryPicker } from '@/components/category/category-picker';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TextField } from '@/components/ui/text-field';
import { ThemedText } from '@/components/themed-text';
import { DEFAULT_PRIORITY } from '@/constants/priorities';
import { Spacing } from '@/constants/theme';
import type { Category, NewTask } from '@/domain/types';
import { endOfDay } from '@/utils/dates';

type QuickAddCardProps = {
  categories: readonly Category[];
  now: Date;
  onSubmit: (task: NewTask) => void | Promise<void>;
};

/**
 * "Quick Execution" on desktop Home: type a name, pick a category, submit.
 * The button stays disabled until there is a name and a category (category is required).
 * The task is due at the end of today with medium priority; edit it afterwards for anything else.
 */
export function QuickAddCard({ categories, now, onSubmit }: QuickAddCardProps) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const ready = name.trim().length > 0 && categoryId !== '';

  const submit = async () => {
    if (!ready) return;
    await onSubmit({
      name: name.trim(),
      description: '',
      categoryId,
      priority: DEFAULT_PRIORITY,
      dueAt: endOfDay(now),
    });
    setName('');
  };

  return (
    <Card style={styles.stack}>
      <ThemedText variant="labelXs" color="onSurfaceVariant" accessibilityRole="header">
        Quick add
      </ThemedText>
      <TextField
        accessibilityLabel="Quick add task name"
        value={name}
        onChangeText={setName}
        placeholder="Add urgent task or brief note..."
        onSubmitEditing={submit}
        returnKeyType="done"
      />
      {categories.length > 0 ? (
        <CategoryPicker categories={categories} value={categoryId} onChange={setCategoryId} />
      ) : (
        <ThemedText variant="bodySm" color="onSurfaceVariant">
          Create a category first to add tasks.
        </ThemedText>
      )}
      <View>
        <Button label="Fast Submit" icon="add" disabled={!ready} onPress={submit} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: Spacing.md,
  },
});
