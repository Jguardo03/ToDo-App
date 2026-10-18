import { useRouter } from 'expo-router';

import { CategoriesContent } from '@/components/category/categories-content';
import { useCategories } from '@/hooks/use-categories';
import { useTaskActions } from '@/hooks/use-task-actions';
import { useTasks } from '@/hooks/use-tasks';
import { userMessage } from '@/repositories/messages';

export default function CategoriesScreen() {
  const router = useRouter();
  const categories = useCategories();
  const tasks = useTasks();
  const actions = useTaskActions();

  const loadError = categories.error ?? tasks.error;

  return (
    <CategoriesContent
      categories={categories.data ?? []}
      tasks={tasks.data ?? []}
      loading={categories.loading || tasks.loading}
      error={loadError ? userMessage(loadError) : undefined}
      onOpenCategory={(category) => router.push({ pathname: '/category/[id]', params: { id: category.id } })}
      onCreate={async (input) => {
        try {
          await actions.createCategory(input);
          return undefined;
        } catch (error) {
          return userMessage(error);
        }
      }}
    />
  );
}
