import { StyleSheet, View } from 'react-native';

import { IconButton } from '@/components/ui/icon-button';
import { ThemedText } from '@/components/themed-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session';

type AccountBarProps = {
  /** `card` is the footer of the desktop side nav; `bar` is the slim strip above phone screens. */
  variant?: 'card' | 'bar';
};

/** Shows who is signed in and lets them sign out. */
export function AccountBar({ variant = 'card' }: AccountBarProps) {
  const { username, signOut } = useSession();
  if (!username) return null;

  return (
    <View style={[styles.row, variant === 'card' ? styles.card : styles.bar]}>
      <ThemedText variant="labelMd" numberOfLines={1} style={styles.name}>
        {`@${username}`}
      </ThemedText>
      <IconButton icon="logout" label="Sign out" tile={false} onPress={() => void signOut()} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  card: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  bar: {
    paddingHorizontal: Spacing.margin,
    paddingTop: Spacing.sm,
  },
  name: {
    flex: 1,
  },
});
