import {
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore';

import type { Category } from '@/domain/types';
import { validateCategoryPatch, validateNewCategory } from '@/domain/validation';
import { RepositoryError } from '@/repositories/errors';
import { guard, requireExisting, toRepositoryError } from '@/repositories/firestore/guard';
import { categoryFromData, categoryToData, toTimestamp } from '@/repositories/firestore/mappers';
import { categoriesCol, categoryRef, tasksCol } from '@/repositories/firestore/paths';
import { byCreatedAt } from '@/repositories/sort';
import type { CategoryRepository, RepositoryOptions } from '@/repositories/types';
import { assertId, assertUsername, assertValid } from '@/repositories/validate';

export function createCategoryRepository(db: Firestore, options: RepositoryOptions = {}): CategoryRepository {
  const now = options.now ?? (() => new Date());

  const toCategories = (docs: { id: string; data: () => DocumentData }[]): Category[] =>
    docs.map((d) => categoryFromData(d.id, d.data())).sort(byCreatedAt);

  return {
    list: (username) =>
      guard(async () => {
        assertUsername(username);
        return toCategories((await getDocs(categoriesCol(db, username))).docs);
      }),

    subscribe: (username, onData, onError) => {
      assertUsername(username);
      return onSnapshot(
        categoriesCol(db, username),
        (snapshot) => onData(toCategories(snapshot.docs)),
        (error) => onError?.(toRepositoryError(error)),
      );
    },

    get: (username, id) =>
      guard(async () => {
        assertUsername(username);
        assertId(id, 'category');
        const snap = await getDoc(categoryRef(db, username, id));
        return snap.exists() ? categoryFromData(snap.id, snap.data()) : null;
      }),

    create: (username, input) =>
      guard(async () => {
        assertUsername(username);
        assertValid(validateNewCategory(input));
        const at = now();
        const ref = doc(categoriesCol(db, username));
        const category: Category = {
          id: ref.id,
          name: input.name.trim(),
          description: input.description,
          color: input.color,
          createdAt: at,
          updatedAt: at,
        };
        await setDoc(ref, categoryToData(category));
        return category;
      }),

    update: (username, id, patch) =>
      guard(async () => {
        assertUsername(username);
        assertId(id, 'category');
        assertValid(validateCategoryPatch(patch));
        const changes: DocumentData = { updatedAt: toTimestamp(now()) };
        if (patch.name !== undefined) changes.name = patch.name.trim();
        if (patch.description !== undefined) changes.description = patch.description;
        if (patch.color !== undefined) changes.color = patch.color;
        const ref = categoryRef(db, username, id);
        await requireExisting(ref, 'Category');
        await updateDoc(ref, changes);
      }),

    remove: (username, id) =>
      guard(async () => {
        assertUsername(username);
        assertId(id, 'category');
        const inUse = await getDocs(query(tasksCol(db, username), where('categoryId', '==', id), limit(1)));
        if (!inUse.empty) {
          throw new RepositoryError('category-in-use', 'Move or delete the tasks in this category first.');
        }
        await deleteDoc(categoryRef(db, username, id));
      }),
  };
}
