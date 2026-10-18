import { makeTask, minutesFromNow } from '../../config/jest/factories';

import { filterCategories, groupTasksByCategory, orderCategoryTasks } from '@/domain/categories';
import { CATEGORY_COLORS, CATEGORY_STARTERS, starterColor } from '@/constants/category-colors';

const categories = [
  { name: 'Design', description: 'Wireframes and UI kits' },
  { name: 'Development', description: 'Building things' },
  { name: 'Meeting', description: 'Syncs, reviews and design crits' },
];

describe('filterCategories', () => {
  it('keeps everything for an empty or blank query', () => {
    expect(filterCategories(categories, '')).toHaveLength(3);
    expect(filterCategories(categories, '   ')).toHaveLength(3);
  });

  it('matches name or description, ignoring case and surrounding spaces', () => {
    expect(filterCategories(categories, ' DEV ').map((c) => c.name)).toEqual(['Development']);
    expect(filterCategories(categories, 'design').map((c) => c.name)).toEqual(['Design', 'Meeting']);
    expect(filterCategories(categories, 'zzz')).toEqual([]);
  });

  it('does not change the input', () => {
    const copy = [...categories];
    filterCategories(categories, 'x');
    expect(categories).toEqual(copy);
  });
});

describe('groupTasksByCategory', () => {
  it('groups by category id and leaves empty categories out', () => {
    const groups = groupTasksByCategory([
      makeTask({ id: 'a', categoryId: 'c1' }),
      makeTask({ id: 'b', categoryId: 'c2' }),
      makeTask({ id: 'c', categoryId: 'c1' }),
    ]);
    expect(groups.get('c1')?.map((t) => t.id)).toEqual(['a', 'c']);
    expect(groups.get('c2')?.map((t) => t.id)).toEqual(['b']);
    expect(groups.has('c3')).toBe(false);
  });
});

describe('orderCategoryTasks', () => {
  it('puts active tasks first, soonest due, then done tasks, latest due first', () => {
    const ordered = orderCategoryTasks([
      makeTask({ id: 'done-old', status: 'done', dueAt: minutesFromNow(-300) }),
      makeTask({ id: 'later', status: 'pending', dueAt: minutesFromNow(120) }),
      makeTask({ id: 'done-new', status: 'done', dueAt: minutesFromNow(-10) }),
      makeTask({ id: 'soon', status: 'in_process', dueAt: minutesFromNow(5) }),
    ]);
    expect(ordered.map((t) => t.id)).toEqual(['soon', 'later', 'done-new', 'done-old']);
  });
});

describe('starter categories', () => {
  it('has the five suggested names and gives each a palette colour', () => {
    expect(CATEGORY_STARTERS).toEqual(['Design', 'Development', 'Coding', 'Meeting', 'Personal']);
    expect(starterColor(0)).toBe(CATEGORY_COLORS[0]);
    expect(starterColor(CATEGORY_COLORS.length)).toBe(CATEGORY_COLORS[0]);
    expect(new Set(CATEGORY_STARTERS.map((_, i) => starterColor(i))).size).toBe(CATEGORY_STARTERS.length);
  });
});
