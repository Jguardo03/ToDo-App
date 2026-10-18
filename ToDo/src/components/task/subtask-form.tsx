import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CategoryChip } from '@/components/category/category-chip';
import { FormLayout } from '@/components/layout/form-layout';
import { PriorityPicker } from '@/components/task/priority-picker';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DateTimeField } from '@/components/ui/date-time-field';
import { Icon } from '@/components/ui/icon';
import { TextArea, TextField } from '@/components/ui/text-field';
import { ThemedText } from '@/components/themed-text';
import { DEFAULT_PRIORITY } from '@/constants/priorities';
import { Spacing } from '@/constants/theme';
import type { NewSubtask, PriorityKey } from '@/domain/types';
import { validateNewSubtask, type FieldErrors } from '@/domain/validation';
import { formatDateTime, formatRelativeDay } from '@/utils/dates';

type SubtaskFormProps = {
  /** The task the subtask belongs to. Its category is shown locked: subtasks inherit it. */
  parent: { id: string; name: string; dueAt: Date; category: { name: string; color: string } };
  now: Date;
  busy?: boolean;
  onSubmit: (input: NewSubtask) => void | Promise<void>;
  onCancel?: () => void;
};

/** Add-subtask form (mockups: add_subtask, mobile_add_subtask). */
export function SubtaskForm({ parent, now, busy, onSubmit, onCancel }: SubtaskFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dueAt, setDueAt] = useState<Date | undefined>(parent.dueAt);
  const [priority, setPriority] = useState<PriorityKey>(DEFAULT_PRIORITY);
  const [errors, setErrors] = useState<FieldErrors<NewSubtask>>({});

  const submit = () => {
    const input: NewSubtask = {
      name: name.trim(),
      description,
      priority,
      dueAt: dueAt ?? new Date(Number.NaN),
    };
    const result = validateNewSubtask(input);
    setErrors(result.ok ? {} : result.errors);
    if (result.ok) void onSubmit(input);
  };

  const shortId = parent.id.slice(0, 6).toUpperCase();

  return (
    <FormLayout
      title="New Subtask"
      subtitle="Inherits the category of its parent task."
      badge="Subtask"
      actions={
        <>
          {onCancel ? <Button label="Cancel" variant="secondary" onPress={onCancel} /> : null}
          <Button label="Add Subtask" icon="check" loading={busy} onPress={submit} />
        </>
      }
      main={
        <>
          <Card accent={parent.category.color} style={styles.stack}>
            <View style={styles.spread}>
              <View style={styles.inline}>
                <Icon name="subtask" size={16} color="secondary" />
                <ThemedText variant="labelXs" color="secondary">
                  Parent task
                </ThemedText>
              </View>
              <ThemedText variant="labelXs" color="onSurfaceVariant">
                {shortId}
              </ThemedText>
            </View>
            <ThemedText variant="headlineLg">{parent.name}</ThemedText>
            <View style={styles.inline}>
              <Icon name="calendar" size={14} color="onSurfaceVariant" />
              <ThemedText variant="bodySm" color="onSurfaceVariant">
                {formatDateTime(parent.dueAt)}
              </ThemedText>
            </View>
          </Card>

          <Card style={styles.stack}>
            <TextField
              label="Subtask Name"
              value={name}
              onChangeText={setName}
              placeholder="What needs to be done?"
              icon="edit"
              error={errors.name}
            />
            <TextArea
              label="Description & Specs"
              value={description}
              onChangeText={setDescription}
              placeholder="Add details..."
              hint="Markdown ok"
              error={errors.description}
            />
          </Card>
        </>
      }
      side={
        <Card style={styles.stack}>
          <DateTimeField label="Due Date & Time" value={dueAt} onChange={setDueAt} error={errors.dueAt} />
          {dueAt && !Number.isNaN(dueAt.getTime()) ? (
            <ThemedText variant="labelXs" color="secondary">
              {formatRelativeDay(dueAt, now)}
            </ThemedText>
          ) : null}

          <View style={styles.spread}>
            <ThemedText variant="headlineSm" accessibilityRole="header">
              Category
            </ThemedText>
            <View style={styles.inline}>
              <Icon name="lock" size={12} color="secondary" />
              <ThemedText variant="labelXs" color="secondary">
                Inherited from parent
              </ThemedText>
            </View>
          </View>
          <CategoryChip name={parent.category.name} color={parent.category.color} />

          <ThemedText variant="headlineSm" accessibilityRole="header">
            Priority
          </ThemedText>
          <PriorityPicker value={priority} onChange={setPriority} />
        </Card>
      }
    />
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: Spacing.md,
  },
  spread: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
  },
});
