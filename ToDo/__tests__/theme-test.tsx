import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, FontFamily, Layout, Radius, Typography } from '@/constants/theme';

describe('design tokens (ToDo_Mockup DESIGN.md)', () => {
  it('keeps the brand colours', () => {
    expect(Colors.primary).toBe('#b7004f');
    expect(Colors.primaryContainer).toBe('#e40a65');
    expect(Colors.secondaryContainer).toBe('#53f9fb');
    expect(Colors.surface).toBe('#fbf8ff');
  });

  it('converts letter spacing from em to px', () => {
    expect(Typography.headlineXl).toMatchObject({
      fontFamily: FontFamily.bold,
      fontSize: 36,
      lineHeight: 44,
      letterSpacing: -1.08,
    });
    expect(Typography.labelXs.letterSpacing).toBe(0.8);
  });

  it('converts radii from rem and requires 48px touch targets', () => {
    expect(Radius.lg).toBe(16);
    expect(Radius.xl).toBe(24);
    expect(Layout.minTouchTarget).toBe(48);
  });
});

describe('ThemedText', () => {
  it('applies the variant typography and colour', () => {
    render(
      <ThemedText variant="headlineLg" color="primary">
        Title
      </ThemedText>,
    );

    const style = StyleSheet.flatten(screen.getByText('Title').props.style);
    expect(style).toMatchObject({ fontFamily: FontFamily.semibold, fontSize: 24, color: Colors.primary });
  });

  it('uppercases label-xs text', () => {
    render(<ThemedText variant="labelXs">badge</ThemedText>);

    expect(StyleSheet.flatten(screen.getByText('badge').props.style)).toMatchObject({
      textTransform: 'uppercase',
    });
  });
});
