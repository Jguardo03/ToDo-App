import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryCard } from '@/components/category/category-card';
import { CategoryForm } from '@/components/category/category-form';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorBanner } from '@/components/ui/error-banner';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { TextField } from '@/components/ui/text-field';
import { ThemedText } from '@/components/themed-text';
import { CATEGORY_STARTERS, starterColor } from '@/constants/category-colors';
import { Colors, Layout, Spacing } from '@/constants/theme';
import { filterCategories, groupTasksByCategory } from '@/domain/categories';
import type { Category, NewCategory, Task } from '@/domain/types';

type CategoriesContentProps = {
  categories: readonly Category[];
  tasks: readonly Task[];
  loading?: boolean;
  /** A message when loading failed. */
  error?: string;
  onOpenCategory: (category: Category) => void;
  /** Saves a new category. Resolves with an error message, or nothing when it worked. */
  onCreate: (input: NewCategory) => Promise<string | undefined>;
};

/** The Categories screen (mockups: mobile_categories, categories, mobile_categories_empty_stage). Pure: data and actions are props. */
export function CategoriesContent({ categories, tasks, loading, error, onOpenCategory, onCreate }: CategoriesContentProps) {
  const { width } = useWindowDimensions();
  const desktop = width >= Layout.desktopBreakpoint;
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState<string>();

  const groups = useMemo(() => groupTasksByCategory(tasks), [tasks]);
  const visible = useMemo(() => filterCategories(categories, query), [categories, query]);
  const searching = desktop || searchOpen;

  const create = async (input: NewCategory) => {
    setSaving(true);
    setCreateError(undefined);
    const failure = await onCreate(input);
    setSaving(false);
    if (failure) setCreateError(failure);
    else setSheetOpen(false);
  };

  const starter = async (name: string, index: number) => {
    setCreateError(undefined);
    const failure = await onCreate({ name, description: '', color: starterColor(index) });
    if (failure) setCreateError(failure);
  };

  const cardWidth = desktop ? styles.cardDesktop : styles.cardPhone;

  return (
    <SafeAreaView edges={desktop ? ['top'] : []} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.page, desktop && styles.pageDesktop]}>
          <View style={styles.header}>
            <View style={styles.titles}>
              <ThemedText variant="headlineXl" accessibilityRole="header">
                Categories
              </ThemedText>
              <ThemedText variant="labelXs" color="onSurfaceVariant" style={styles.plainLabel}>
                {`${categories.length} ${categories.length === 1 ? 'category' : 'categories'} • ${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}`}
              </ThemedText>
            </View>
            {categories.length > 0 ? (
              desktop ? (
                <View style={styles.search}>
                  <TextField
                    accessibilityLabel="Search categories"
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Filter categories..."
                    icon="search"
                  />
                </View>
              ) : (
                <IconButton
                  icon={searchOpen ? 'close' : 'search'}
                  label={searchOpen ? 'Close search' : 'Search categories'}
                  onPress={() => {
                    setSearchOpen((open) => !open);
                    if (searchOpen) setQuery('');
                  }}
                />
              )
            ) : null}
          </View>

          {searching && !desktop ? (
            <TextField accessibilityLabel="Search categories" value={query} onChangeText={setQuery} placeholder="Filter categories..." icon="search" />
          ) : null}

          {error ? <ErrorBanner message={error} /> : null}
          {createError ? <ErrorBanner message={createError} /> : null}

          {loading ? (
            <ActivityIndicator accessibilityLabel="Loading categories" color={Colors.primary} />
          ) : categories.length === 0 ? (
            <View style={styles.stack}>
              <Card>
                <EmptyState
                  icon="folder"
                  title="Organize Your Universe"
                  message="Categories keep your tasks neatly sorted: design, development, meetings and more."
                >
                  <Button label="Create First Category" icon="newTask" onPress={() => setSheetOpen(true)} />
                  <ThemedText variant="labelXs" color="onSurfaceVariant" accessibilityRole="header">
                    Suggested starters
                  </ThemedText>
                  <View style={styles.starters}>
                    {CATEGORY_STARTERS.map((name, index) => (
                      <Chip key={name} size="md" icon="add" label={name} onPress={() => starter(name, index)} />
                    ))}
                  </View>
                </EmptyState>
              </Card>
              <Card tone="muted" style={styles.tip}>
                <Icon name="bolt" size={20} color="tertiary" />
                <ThemedText variant="bodyMd" color="onSurfaceVariant" style={styles.tipText}>
                  Tip: giving tasks a category unlocks filtered views and progress tracking.
                </ThemedText>
              </Card>
            </View>
          ) : (
            <View style={styles.grid}>
              <View style={cardWidth}>
                <Card tone="muted" onPress={() => setSheetOpen(true)} accessibilityLabel="New Category" style={styles.newCard}>
                  <View style={styles.newBadge}>
                    <Icon name="add" size={32} color="secondary" />
                  </View>
                  <ThemedText variant="headlineSm" color="secondary">
                    New Category
                  </ThemedText>
                  <ThemedText variant="labelXs" color="onSurfaceVariant">
                    Add category
                  </ThemedText>
                </Card>
              </View>
              {visible.map((category) => {
                const own = groups.get(category.id) ?? [];
                return (
                  <View key={category.id} style={cardWidth}>
                    <CategoryCard
                      category={category}
                      taskCount={own.length}
                      doneCount={desktop ? own.filter((task) => task.status === 'done').length : undefined}
                      onPress={() => onOpenCategory(category)}
                    />
                  </View>
                );
              })}
              {visible.length === 0 ? (
                <ThemedText variant="bodyMd" color="onSurfaceVariant">
                  No categories match your search.
                </ThemedText>
              ) : null}
            </View>
          )}
        </View>
      </ScrollView>

      <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} title="New category">
        <CategoryForm busy={saving} onSubmit={create} onCancel={() => setSheetOpen(false)} />
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    padding: Spacing.margin,
  },
  page: {
    width: '100%',
    maxWidth: Layout.mobileMaxWidth,
    gap: Spacing.lg,
  },
  pageDesktop: {
    maxWidth: Layout.contentMaxWidth,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  titles: {
    gap: Spacing.xs,
  },
  plainLabel: {
    textTransform: 'none',
  },
  search: {
    width: 320,
  },
  stack: {
    gap: Spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.gutter,
  },
  cardPhone: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  cardDesktop: {
    flexBasis: '31%',
    flexGrow: 1,
  },
  newCard: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  newBadge: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  starters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  tipText: {
    flex: 1,
  },
});
