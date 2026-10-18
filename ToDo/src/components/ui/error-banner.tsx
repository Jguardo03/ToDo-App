import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/themed-text';
import { Colors, Radius, Spacing } from '@/constants/theme';

type ErrorBannerProps = {
  message: string;
  onRetry?: () => void;
};

/** A failed load or save, in words, with an optional retry. */
export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <View accessible accessibilityRole="alert" style={styles.banner}>
      <Icon name="close" size={18} color="onErrorContainer" />
      <ThemedText variant="bodyMd" color="onErrorContainer" style={styles.text}>
        {message}
      </ThemedText>
      {onRetry ? <Button label="Retry" variant="ghost" onPress={onRetry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.errorContainer,
  },
  text: {
    flex: 1,
  },
});
