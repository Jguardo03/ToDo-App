/**
 * Design tokens copied from ToDo_Mockup/*\/DESIGN.md (front-matter block).
 * The mockups are light-only, so there is a single palette.
 * Values must stay in sync with that file; components never hard-code colours.
 */

import '@/global.css';

export const Colors = {
  surface: '#fbf8ff',
  surfaceDim: '#dbd9e1',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f5f2fb',
  surfaceContainer: '#efecf5',
  surfaceContainerHigh: '#eae7ef',
  surfaceContainerHighest: '#e4e1ea',
  onSurface: '#1b1b21',
  onSurfaceVariant: '#5b3f44',
  inverseSurface: '#303036',
  inverseOnSurface: '#f2eff8',
  outline: '#8f6f74',
  outlineVariant: '#e4bdc3',
  primary: '#b7004f',
  onPrimary: '#ffffff',
  primaryContainer: '#e40a65',
  onPrimaryContainer: '#fffbff',
  inversePrimary: '#ffb1c0',
  primaryFixed: '#ffd9df',
  secondary: '#00696b',
  onSecondary: '#ffffff',
  secondaryContainer: '#53f9fb',
  onSecondaryContainer: '#007072',
  tertiary: '#795600',
  onTertiary: '#ffffff',
  tertiaryContainer: '#986d00',
  tertiaryFixed: '#ffdea8',
  onTertiaryFixedVariant: '#5e4200',
  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',
  background: '#fbf8ff',
  onBackground: '#1b1b21',
} as const;

export type ThemeColor = keyof typeof Colors;

/** Sora weights registered with `useFonts` in `src/app/_layout.tsx`. */
export const FontFamily = {
  regular: 'Sora_400Regular',
  medium: 'Sora_500Medium',
  semibold: 'Sora_600SemiBold',
  bold: 'Sora_700Bold',
} as const;

export type TextVariant =
  | 'headlineXl'
  | 'headlineLg'
  | 'headlineSm'
  | 'bodyLg'
  | 'bodyMd'
  | 'bodySm'
  | 'labelMd'
  | 'labelXs';

type TypographyStyle = {
  fontFamily: (typeof FontFamily)[keyof typeof FontFamily];
  fontSize: number;
  lineHeight: number;
  /** In px (the mockup gives em, converted as em * fontSize). */
  letterSpacing: number;
};

const type = (
  fontFamily: TypographyStyle['fontFamily'],
  fontSize: number,
  lineHeight: number,
  letterSpacingEm: number,
): TypographyStyle => ({
  fontFamily,
  fontSize,
  lineHeight,
  letterSpacing: Math.round(letterSpacingEm * fontSize * 100) / 100,
});

export const Typography: Record<TextVariant, TypographyStyle> = {
  headlineXl: type(FontFamily.bold, 36, 44, -0.03),
  headlineLg: type(FontFamily.semibold, 24, 32, -0.02),
  headlineSm: type(FontFamily.semibold, 18, 24, -0.01),
  bodyLg: type(FontFamily.regular, 16, 24, -0.01),
  bodyMd: type(FontFamily.regular, 14, 20, 0),
  bodySm: type(FontFamily.regular, 12, 16, 0.01),
  labelMd: type(FontFamily.semibold, 13, 16, 0.02),
  labelXs: type(FontFamily.bold, 10, 12, 0.08),
};

/** Mobile headline from DESIGN.md (`headline-xl-mobile`). */
export const HeadlineXlMobile = type(FontFamily.bold, 28, 34, -0.025);

/** rem values in DESIGN.md converted at 16px. */
export const Radius = {
  sm: 4,
  default: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  /** Screen edge margin on phones. */
  margin: 16,
  marginMd: 24,
  /** Gap between cards in grids. */
  gutter: 12,
} as const;

export const Layout = {
  /** At or above this window width the side nav replaces the bottom dock. */
  desktopBreakpoint: 768,
  /** DESIGN.md: single column, max 480px on phones. */
  mobileMaxWidth: 480,
  sideNavWidth: 280,
  contentMaxWidth: 1280,
  /** Mockup requires 48px touch targets. */
  minTouchTarget: 48,
} as const;
