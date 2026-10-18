import { useRepositories } from '@/context/repositories';
import { useUsername } from '@/context/session';
import type { Category } from '@/domain/types';
import { useLiveList, type LiveList } from '@/hooks/use-live-list';

/** All of the signed-in user's categories, oldest first, updating live. */
export function useCategories(): LiveList<Category> {
  const { categories } = useRepositories();
  return useLiveList(categories, useUsername());
}
