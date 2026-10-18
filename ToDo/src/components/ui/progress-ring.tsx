import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';

type ProgressRingProps = {
  /** 0 to 1. */
  value: number;
  color?: string;
  size?: number;
  strokeWidth?: number;
  label?: string;
};

/** Circular progress with the percent in the middle (mockup: task rows on Home). */
export function ProgressRing({ value, color = Colors.primary, size = 48, strokeWidth = 4, label = 'Progress' }: ProgressRingProps) {
  const fraction = Math.min(1, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.round(fraction * 100);

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={styles.rotated}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={Colors.surfaceContainerHigh} strokeWidth={strokeWidth} fill="transparent" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - fraction)}
        />
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <ThemedText variant="labelXs" style={styles.text}>
          {`${percent}%`}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rotated: {
    transform: [{ rotate: '-90deg' }],
  },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textTransform: 'none',
  },
});
