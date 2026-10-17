/** The three main screens. `name` must match the route file in `src/app/(tabs)/`. */
export const NAV_ITEMS = [
  { name: 'index', href: '/', label: 'Home' },
  { name: 'calendar', href: '/calendar', label: 'Calendar' },
  { name: 'categories', href: '/categories', label: 'Categories' },
] as const;

export const NEW_TASK_HREF = '/task/new';
