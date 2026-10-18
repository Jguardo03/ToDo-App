import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Icon, type IconName } from '@/components/ui/icon';
import { ThemedText } from '@/components/themed-text';
import { STATUSES } from '@/constants/statuses';
import { Colors, Radius, Spacing, type ThemeColor } from '@/constants/theme';
import type { DisplayStatusKey } from '@/domain/types';

const PRESENTATION: Record<DisplayStatusKey, { label: string; icon: IconName; valueColor: ThemeColor }> = {
  overdue: { label: 'Overdue', icon: 'overdue', valueColor: 'error' },
  in_process: { label: 'In Process', icon: 'inProcess', valueColor: 'onSurface' },
  done: { label: 'Completed', icon: 'checkCircle', valueColor: 'primary' },
  pending: { label: 'Pending', icon: 'pending', valueColor: 'onSurface' },
};

type StatCardProps = {
  status: DisplayStatusKey;
  value: number;
  /** Small text after the number, such as "Tasks" or "Active". */
  caption: string;
  onPress?: () => void;
};

/** One of the four numbers on Home. Opens the list of tasks in that state when pressed. */
export function StatCard({ status, value, caption, onPress }: StatCardProps) {
  const info = STATUSES[status];
  const { label, icon, valueColor } = PRESENTATION[status];

  return (
    <Card onPress={onPress} accessibilityLabel={`${label}: ${value} ${caption}`} style={styles.card}>
      <View style={styles.top}>
        <ThemedText variant="labelXs" color="outline">
          {label}
        </ThemedText>
        <View style={[styles.tile, { backgroundColor: Colors[info.background] }]}>
          <Icon name={icon} size={15} color={info.foreground} />
        </View>
      </View>
      <View style={styles.value}>
        <ThemedText variant="headlineLg" color={valueColor}>
          {String(value)}
        </ThemedText>
        <ThemedText variant="bodySm" color="outline">
          {caption}
        </ThemedText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.xs,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tile: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg / 2,
  },
  value: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.xs,
  },
});
