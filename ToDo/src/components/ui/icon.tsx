import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';

import { Colors, type ThemeColor } from '@/constants/theme';

type IconSpec = { material: AndroidSymbol; sf: SFSymbol };

/**
 * Every icon the app uses, by purpose. `material` is the Material Symbols name from the mockups (used on web and
 * Android through expo-symbols); `sf` is the closest SF Symbol for iOS.
 */
export const ICONS = {
  add: { material: 'add', sf: 'plus' },
  back: { material: 'arrow_back', sf: 'chevron.left' },
  forward: { material: 'arrow_forward', sf: 'arrow.right' },
  chevronLeft: { material: 'chevron_left', sf: 'chevron.left' },
  chevronRight: { material: 'chevron_right', sf: 'chevron.right' },
  close: { material: 'close', sf: 'xmark' },
  check: { material: 'check', sf: 'checkmark' },
  checkCircle: { material: 'check_circle', sf: 'checkmark.circle' },
  done: { material: 'task_alt', sf: 'checkmark.seal' },
  edit: { material: 'edit', sf: 'pencil' },
  delete: { material: 'delete', sf: 'trash' },
  search: { material: 'search', sf: 'magnifyingglass' },
  settings: { material: 'settings', sf: 'gearshape' },
  moreVertical: { material: 'more_vert', sf: 'ellipsis' },
  moreHorizontal: { material: 'more_horiz', sf: 'ellipsis' },
  lock: { material: 'lock', sf: 'lock' },
  logout: { material: 'logout', sf: 'rectangle.portrait.and.arrow.right' },
  home: { material: 'home', sf: 'house' },
  calendar: { material: 'calendar_today', sf: 'calendar' },
  calendarMonth: { material: 'calendar_month', sf: 'calendar' },
  folder: { material: 'folder_open', sf: 'folder' },
  clock: { material: 'schedule', sf: 'clock' },
  overdue: { material: 'history', sf: 'clock.arrow.circlepath' },
  inProcess: { material: 'sync', sf: 'arrow.triangle.2.circlepath' },
  pending: { material: 'hourglass_empty', sf: 'hourglass' },
  flag: { material: 'flag', sf: 'flag' },
  tag: { material: 'tag', sf: 'tag' },
  palette: { material: 'palette', sf: 'paintpalette' },
  subtask: { material: 'subdirectory_arrow_right', sf: 'arrow.turn.down.right' },
  radioOff: { material: 'radio_button_unchecked', sf: 'circle' },
  newTask: { material: 'add_task', sf: 'plus.circle' },
  filter: { material: 'tune', sf: 'slider.horizontal.3' },
  bolt: { material: 'bolt', sf: 'bolt' },
  person: { material: 'person', sf: 'person' },
} as const satisfies Record<string, IconSpec>;

export type IconName = keyof typeof ICONS;

type IconProps = {
  name: IconName;
  size?: number;
  color?: ThemeColor;
};

/** Decorative by default: hidden from screen readers. Put the meaning in the parent's accessibility label. */
export function Icon({ name, size = 20, color = 'onSurface' }: IconProps) {
  const { material, sf } = ICONS[name];
  return (
    <SymbolView
      name={{ ios: sf, android: material, web: material }}
      size={size}
      tintColor={Colors[color]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
