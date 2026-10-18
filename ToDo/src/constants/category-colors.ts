/** Colours offered when creating a category. The first four are the category colours in the mockups. */
export const CATEGORY_COLORS = [
  '#b7004f', // design (pink)
  '#00696b', // development (teal)
  '#5b3f44', // coding (mauve)
  '#795600', // meeting (amber)
  '#ba1a1a', // red
  '#4a5bd4', // indigo
] as const;

export const DEFAULT_CATEGORY_COLOR = CATEGORY_COLORS[0];

/** One-tap categories offered on the empty Categories screen (mockup: "Suggested starters"). */
export const CATEGORY_STARTERS = ['Design', 'Development', 'Coding', 'Meeting', 'Personal'] as const;

/** The starter's colour: the palette in order, so each starter looks different. */
export function starterColor(index: number): string {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
}
