import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CategoryPicker } from '@/components/category/category-picker';
import { FormLayout } from '@/components/layout/form-layout';
import { PriorityPicker } from '@/components/task/priority-picker';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { DateTimeField } from '@/components/ui/date-time-field';
import { IconButton } from '@/components/ui/icon-button';
import { TextArea, TextField } from '@/components/ui/text-field';
import { ThemedText } from '@/components/themed-text';
import { DEFAULT_PRIORITY } from '@/constants/priorities';
import { Spacing } from '@/constants/theme';
import type { Category, NewSubtask, NewTask, NewTaskDraft, PriorityKey, StatusKey, Task } from '@/domain/types';
import { validateNewSubtask, validateNewTask, type FieldErrors } from '@/domain/validation';
import { defaultDueAt } from '@/utils/dates';

export type TaskFormValues = NewTaskDraft;

type TaskFormProps = {
  categories: readonly Category[];
  now: Date;
  /** Pre-selected category (for example when opened from a category screen). */
  initialCategoryId?: string;
  /** Selects this category when it changes, for example the one just created from the "New" pill. */
  requestedCategoryId?: string;
  /** Pre-filled due date-time (for example the day selected in the Calendar). */
  initialDueAt?: Date;
  /** Status the new task starts with (for example from "Add Task to Status"). Defaults to pending. */
  initialStatus?: StatusKey;
  /** Edit an existing task: fields start filled in and the inline subtasks section is hidden. */
  initial?: Task;
  title?: string;
  submitLabel?: string;
  busy?: boolean;
  onSubmit: (values: TaskFormValues) => void | Promise<void>;
  onCancel?: () => void;
  onCreateCategory?: () => void;
};

type SubtaskDraft = { key: number; name: string; description: string; dueAt: Date | undefined };

/** Create-task form: name, description, subtasks, due date, category (required) and priority. */
export function TaskForm({
  categories,
  now,
  initialCategoryId,
  requestedCategoryId,
  initialDueAt,
  initialStatus,
  initial,
  title = initial ? 'Edit Task' : 'New Task',
  submitLabel = initial ? 'Save Changes' : 'Create Task',
  busy,
  onSubmit,
  onCancel,
  onCreateCategory,
}: TaskFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [dueAt, setDueAt] = useState<Date | undefined>(initial?.dueAt ?? initialDueAt ?? defaultDueAt(now));
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? initialCategoryId ?? categories[0]?.id ?? '');
  const [priority, setPriority] = useState<PriorityKey>(initial?.priority ?? DEFAULT_PRIORITY);
  const [appliedRequest, setAppliedRequest] = useState(requestedCategoryId);
  if (requestedCategoryId !== appliedRequest) {
    setAppliedRequest(requestedCategoryId);
    if (requestedCategoryId) setCategoryId(requestedCategoryId);
  }
  const [drafts, setDrafts] = useState<SubtaskDraft[]>([]);
  const [nextKey, setNextKey] = useState(1);
  const [errors, setErrors] = useState<FieldErrors<NewTask>>({});
  const [draftErrors, setDraftErrors] = useState<Record<number, FieldErrors<NewSubtask>>>({});

  const addDraft = () => {
    setDrafts((current) => [...current, { key: nextKey, name: '', description: '', dueAt }]);
    setNextKey((key) => key + 1);
  };
  const updateDraft = (key: number, changes: Partial<SubtaskDraft>) =>
    setDrafts((current) => current.map((draft) => (draft.key === key ? { ...draft, ...changes } : draft)));
  const removeDraft = (key: number) => setDrafts((current) => current.filter((draft) => draft.key !== key));

  const submit = () => {
    const task: NewTask = {
      categoryId,
      name: name.trim(),
      description,
      priority,
      ...(initialStatus && initialStatus !== 'pending' ? { status: initialStatus } : {}),
      dueAt: dueAt ?? new Date(Number.NaN),
    };
    const taskResult = validateNewTask(task);

    const subtasks: NewSubtask[] = drafts.map((draft) => ({
      name: draft.name.trim(),
      description: draft.description,
      priority,
      dueAt: draft.dueAt ?? new Date(Number.NaN),
    }));
    const nextDraftErrors: Record<number, FieldErrors<NewSubtask>> = {};
    subtasks.forEach((subtask, index) => {
      // A subtask may not be due after its task (the task's due time as currently entered).
      const result = validateNewSubtask(subtask, { parentDueAt: dueAt });
      if (!result.ok) nextDraftErrors[drafts[index].key] = result.errors;
    });

    setErrors(taskResult.ok ? {} : taskResult.errors);
    setDraftErrors(nextDraftErrors);
    if (taskResult.ok && Object.keys(nextDraftErrors).length === 0) {
      void onSubmit({ task, subtasks });
    }
  };

  const actions = (
    <>
      {onCancel ? <Button label="Cancel" variant="secondary" onPress={onCancel} /> : null}
      <Button label={submitLabel} icon="check" loading={busy} onPress={submit} />
    </>
  );

  const main = (
    <>
      <Card style={styles.stack}>
        <TextField
          label="Task Name"
          value={name}
          onChangeText={setName}
          placeholder="Task Name"
          icon="edit"
          error={errors.name}
          returnKeyType="next"
        />
        <TextArea
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Add a detailed description..."
          hint="Markdown ok"
          error={errors.description}
        />
      </Card>

      {initial ? null : (
      <Card style={styles.stack}>
        <View style={styles.sectionHeader}>
          <View style={styles.inline}>
            <ThemedText variant="headlineSm" accessibilityRole="header">
              Subtasks
            </ThemedText>
            <Chip label="Optional" />
          </View>
          <Button label="Add Subtask" variant="ghost" icon="add" onPress={addDraft} />
        </View>
        {drafts.map((draft, index) => (
          <Card key={draft.key} tone="muted" style={styles.stack}>
            <View style={styles.sectionHeader}>
              <ThemedText variant="labelMd">{`Subtask ${index + 1}`}</ThemedText>
              <IconButton
                icon="delete"
                label={`Remove subtask ${index + 1}`}
                tile={false}
                onPress={() => removeDraft(draft.key)}
              />
            </View>
            <TextField
              accessibilityLabel={`Subtask ${index + 1} name`}
              value={draft.name}
              onChangeText={(value) => updateDraft(draft.key, { name: value })}
              placeholder="Subtask name"
              error={draftErrors[draft.key]?.name}
            />
            <DateTimeField
              accessibilityLabel={`Subtask ${index + 1} due date`}
              value={draft.dueAt}
              onChange={(value) => updateDraft(draft.key, { dueAt: value })}
              error={draftErrors[draft.key]?.dueAt}
            />
            <TextArea
              accessibilityLabel={`Subtask ${index + 1} description`}
              rows={2}
              value={draft.description}
              onChangeText={(value) => updateDraft(draft.key, { description: value })}
              placeholder="Description"
            />
          </Card>
        ))}
      </Card>
      )}
    </>
  );

  const side = (
    <>
      <Card style={styles.stack}>
        <DateTimeField label="Date & Time" value={dueAt} onChange={setDueAt} error={errors.dueAt} />
        {initial ? (
          <ThemedText variant="bodySm" color="onSurfaceVariant">
            Subtasks due later than this move to the new due time.
          </ThemedText>
        ) : null}

        <View style={styles.sectionHeader}>
          <ThemedText variant="headlineSm" accessibilityRole="header">
            Category
          </ThemedText>
          <ThemedText variant="labelXs" color="primary">
            Required
          </ThemedText>
        </View>
        {categories.length === 0 ? (
          <ThemedText variant="bodyMd" color="onSurfaceVariant">
            You have no categories yet. Create one to continue.
          </ThemedText>
        ) : null}
        <CategoryPicker categories={categories} value={categoryId} onChange={setCategoryId} onCreate={onCreateCategory} />
        {errors.categoryId ? (
          <ThemedText variant="bodySm" color="error" accessibilityRole="alert">
            {errors.categoryId}
          </ThemedText>
        ) : null}

        <View style={styles.sectionHeader}>
          <ThemedText variant="headlineSm" accessibilityRole="header">
            Priority
          </ThemedText>
        </View>
        <PriorityPicker value={priority} onChange={setPriority} />
      </Card>
    </>
  );

  return (
    <FormLayout
      title={title}
      subtitle={initial ? 'Change any detail of this task.' : 'Add the details and, if you like, some subtasks.'}
      main={main}
      side={side}
      actions={actions}
    />
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
});
