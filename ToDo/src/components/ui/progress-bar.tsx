import { StyleSheet, View } from 'react-native';

import { Colors, Radius } from '@/constants/theme';

type ProgressBarProps = {
  /** 0 to 1. */
  value: number;
  color?: string;
  label?: string;
  height?: number;
};

export function ProgressBar({ value, color = Colors.primary, label = 'Progress', height = 6 }: ProgressBarProps) {
  const fraction = Math.min(1, Math.max(0, value));

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(fraction * 100) }}
      style={[styles.track, { height }]}>
      <View style={[styles.fill, { width: `${fraction * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  fill: {
    height: '100%',
    borderRadius: Radius.full,
  },
});
