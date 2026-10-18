import { Stack } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CategoryForm } from '@/components/category/category-form';
import { SubtaskForm } from '@/components/task/subtask-form';
import { TaskForm } from '@/components/task/task-form';
import { Segmented } from '@/components/ui/segmented';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { GALLERY_CATEGORIES, GALLERY_NOW, GALLERY_TASKS, categoryById } from '@/dev/gallery-data';

type FormKey = 'task' | 'subtask' | 'category';

/** Dev-only: the three forms with their submitted values printed, to check layouts and validation. */
export default function GalleryFormsScreen() {
  const [form, setForm] = useState<FormKey>('task');
  const [submitted, setSubmitted] = useState('');
  const parent = GALLERY_TASKS[0];
  const category = categoryById(parent.categoryId)!;
  const report = (value: unknown) => setSubmitted(JSON.stringify(value, null, 2));

  return (
    <View style={styles.page}>
      <Stack.Screen options={{ title: 'Forms' }} />
      <View style={styles.bar}>
        <Segmented<FormKey>
          label="Form"
          value={form}
          onChange={(next) => {
            setForm(next);
            setSubmitted('');
          }}
          options={[
            { value: 'task', label: 'Task' },
            { value: 'subtask', label: 'Subtask' },
            { value: 'category', label: 'Category' },
          ]}
        />
      </View>

      {form === 'task' ? (
        <TaskForm categories={GALLERY_CATEGORIES} now={GALLERY_NOW} onSubmit={report} onCancel={() => setSubmitted('cancelled')} onCreateCategory={() => setSubmitted('create category')} />
      ) : null}
      {form === 'subtask' ? (
        <SubtaskForm parent={{ id: parent.id, name: parent.name, dueAt: parent.dueAt, category }} now={GALLERY_NOW} onSubmit={report} onCancel={() => setSubmitted('cancelled')} />
      ) : null}
      {form === 'category' ? (
        <View style={styles.padded}>
          <CategoryForm onSubmit={report} onCancel={() => setSubmitted('cancelled')} />
        </View>
      ) : null}

      {submitted ? (
        <View style={styles.output} accessibilityLabel="Submitted values">
          <ThemedText variant="labelXs" color="onSurfaceVariant">
            Submitted
          </ThemedText>
          <ThemedText variant="bodySm">{submitted}</ThemedText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  bar: {
    padding: Spacing.margin,
  },
  padded: {
    padding: Spacing.margin,
  },
  output: {
    padding: Spacing.margin,
    gap: Spacing.xs,
    backgroundColor: Colors.surfaceContainerLow,
  },
});
