import { Link, Stack } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { CategoryCard } from '@/components/category/category-card';
import { CategoryChip } from '@/components/category/category-chip';
import { CategoryPicker } from '@/components/category/category-picker';
import { PriorityChip } from '@/components/task/priority-chip';
import { PriorityPicker } from '@/components/task/priority-picker';
import { QuickAddCard } from '@/components/task/quick-add-card';
import { StatusChip } from '@/components/task/status-chip';
import { StatusPicker } from '@/components/task/status-picker';
import { SubtaskRow } from '@/components/task/subtask-row';
import { TaskCard } from '@/components/task/task-card';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DateTimeField } from '@/components/ui/date-time-field';
import { EmptyState } from '@/components/ui/empty-state';
import { ICONS, Icon, type IconName } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { ProgressRing } from '@/components/ui/progress-ring';
import { TextArea, TextField } from '@/components/ui/text-field';
import { ThemedText } from '@/components/themed-text';
import { Colors, Layout, Spacing } from '@/constants/theme';
import type { PriorityKey, StatusKey } from '@/domain/types';
import { CategoryForm } from '@/components/category/category-form';
import {
  GALLERY_CATEGORIES,
  GALLERY_NOW,
  GALLERY_SUBTASKS,
  GALLERY_TASKS,
  categoryById,
} from '@/dev/gallery-data';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText variant="headlineLg" accessibilityRole="header">
        {title}
      </ThemedText>
      {children}
    </View>
  );
}

/** Dev-only page showing every shared component in every state, to compare with ToDo_Mockup/*. */
export default function GalleryScreen() {
  const [checked, setChecked] = useState(false);
  const [text, setText] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState<Date | undefined>(GALLERY_NOW);
  const [priority, setPriority] = useState<PriorityKey>('high');
  const [status, setStatus] = useState<StatusKey>('in_process');
  const [categoryId, setCategoryId] = useState('design');
  const [sheet, setSheet] = useState(false);
  const task = GALLERY_TASKS[0];
  const cat = categoryById(task.categoryId);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Component gallery' }} />
      <View style={styles.page}>
        <ThemedText variant="bodyMd" color="onSurfaceVariant">
          Dev only. Every shared component, in the states the mockups use.
        </ThemedText>
        <Link href="/__gallery/forms" asChild>
          <Button label="Open the forms" variant="secondary" />
        </Link>

        <Section title="Buttons">
          <View style={styles.row}>
            <Button label="Create Task" icon="check" onPress={() => {}} />
            <Button label="Cancel" variant="secondary" onPress={() => {}} />
            <Button label="Add" variant="ghost" icon="add" onPress={() => {}} />
            <Button label="Disabled" disabled />
            <Button label="Saving" loading />
          </View>
          <View style={styles.row}>
            <IconButton icon="settings" label="Settings" onPress={() => {}} />
            <IconButton icon="back" label="Back" onPress={() => {}} />
            <IconButton icon="moreVertical" label="More" onPress={() => {}} />
          </View>
        </Section>

        <Section title="Chips">
          <View style={styles.row}>
            <PriorityChip priority="low" />
            <PriorityChip priority="medium" />
            <PriorityChip priority="high" />
            <PriorityChip priority="urgent" />
          </View>
          <View style={styles.row}>
            <StatusChip status="pending" />
            <StatusChip status="in_process" />
            <StatusChip status="done" />
            <StatusChip status="overdue" />
          </View>
          <View style={styles.row}>
            {GALLERY_CATEGORIES.map((c) => (
              <CategoryChip key={c.id} name={c.name} color={c.color} />
            ))}
          </View>
        </Section>

        <Section title="Pickers">
          <PriorityPicker value={priority} onChange={setPriority} />
          <StatusPicker value={status} onChange={setStatus} />
          <StatusPicker value="pending" onChange={() => {}} overdue />
          <CategoryPicker categories={GALLERY_CATEGORIES} value={categoryId} onChange={setCategoryId} onCreate={() => setSheet(true)} />
        </Section>

        <Section title="Inputs">
          <TextField label="Task Name" value={text} onChangeText={setText} placeholder="Task Name" icon="edit" />
          <TextField label="With error" value="" onChangeText={() => {}} error="Enter a name." />
          <TextArea label="Description" value={notes} onChangeText={setNotes} placeholder="Add a detailed description..." hint="Markdown ok" />
          <DateTimeField label="Date & Time" value={date} onChange={setDate} />
          <View style={styles.row}>
            <Checkbox checked={checked} onChange={setChecked} label="Toggle" />
            <Checkbox checked label="Checked" onChange={() => {}} />
          </View>
        </Section>

        <Section title="Progress">
          <View style={styles.row}>
            <ProgressRing value={0.4} />
            <ProgressRing value={0.75} color={Colors.secondary} />
            <ProgressRing value={1} color={Colors.tertiary} />
          </View>
          <View style={styles.row}>
            <ProgressBar value={0.6} />
          </View>
        </Section>

        <Section title="Task cards">
          <TaskCard task={task} category={cat} now={GALLERY_NOW} onToggleDone={() => {}} onPress={() => {}} />
          <TaskCard task={GALLERY_TASKS[2]} category={categoryById('meeting')} now={GALLERY_NOW} onToggleDone={() => {}} />
          <TaskCard task={GALLERY_TASKS[1]} category={categoryById('dev')} now={GALLERY_NOW} variant="category" onToggleDone={() => {}} />
          <TaskCard task={GALLERY_TASKS[0]} category={cat} now={GALLERY_NOW} variant="status" onToggleDone={() => {}} />
          <TaskCard task={GALLERY_TASKS[3]} category={cat} now={GALLERY_NOW} onToggleDone={() => {}} />
        </Section>

        <Section title="Subtasks">
          {GALLERY_SUBTASKS.map((s) => (
            <SubtaskRow key={s.id} subtask={s} now={GALLERY_NOW} onToggle={() => {}} />
          ))}
        </Section>

        <Section title="Category cards">
          <View style={styles.row}>
            {GALLERY_CATEGORIES.map((c) => (
              <View key={c.id} style={styles.half}>
                <CategoryCard category={c} taskCount={c.id === 'design' ? 8 : 1} onPress={() => {}} />
              </View>
            ))}
          </View>
        </Section>

        <Section title="Quick add">
          <QuickAddCard categories={GALLERY_CATEGORIES} now={GALLERY_NOW} onSubmit={() => {}} />
        </Section>

        <Section title="Empty state and sheet">
          <Card>
            <EmptyState icon="done" title="Clear Skies Ahead!" message="You're completely caught up. Take a breather, review your calendar, or plan what's next.">
              <Button label="Add First Task" icon="newTask" onPress={() => {}} />
            </EmptyState>
          </Card>
          <Button label="Open bottom sheet" variant="secondary" onPress={() => setSheet(true)} />
        </Section>

        <Section title="Icons">
          <View style={styles.row}>
            {(Object.keys(ICONS) as IconName[]).map((name) => (
              <View key={name} style={styles.icon}>
                <Icon name={name} size={24} />
                <ThemedText variant="bodySm" color="onSurfaceVariant">
                  {name}
                </ThemedText>
              </View>
            ))}
          </View>
        </Section>

        <BottomSheet visible={sheet} onClose={() => setSheet(false)} title="New category">
          <CategoryForm onSubmit={() => setSheet(false)} onCancel={() => setSheet(false)} />
        </BottomSheet>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    alignItems: 'center',
    padding: Spacing.margin,
  },
  page: {
    width: '100%',
    maxWidth: Layout.contentMaxWidth,
    gap: Spacing.xl,
  },
  section: {
    gap: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.md,
  },
  half: {
    flexGrow: 1,
    flexBasis: 160,
  },
  icon: {
    width: 88,
    alignItems: 'center',
    gap: 2,
  },
});
