import { StyleSheet, View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  /** Label of the button that does the destructive thing, for example "Delete Task". */
  confirmLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Asks before something is deleted. `Alert.alert` does not work on the web, so this is our own sheet,
 * with Cancel as the first, safe choice.
 */
export function ConfirmDialog({ visible, title, message, confirmLabel, busy, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <BottomSheet visible={visible} onClose={onCancel} title={title}>
      <View style={styles.body}>
        <ThemedText variant="bodyMd" color="onSurfaceVariant">
          {message}
        </ThemedText>
        <Button label="Cancel" variant="secondary" onPress={onCancel} />
        <Button label={confirmLabel} variant="danger" icon="delete" loading={busy} onPress={onConfirm} />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: Spacing.md,
  },
});
