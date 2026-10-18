import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { IconButton } from '@/components/ui/icon-button';
import { ThemedText } from '@/components/themed-text';
import { Colors, Layout, Radius, Spacing } from '@/constants/theme';

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

/** Modal panel that slides up from the bottom (phones) and sits centred at a capped width (desktop). */
export function BottomSheet({ visible, onClose, title, children }: BottomSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable accessibilityLabel="Close" accessibilityRole="button" style={StyleSheet.absoluteFill} onPress={onClose} />
        <View accessibilityViewIsModal style={styles.sheet}>
          <View style={styles.header}>
            <ThemedText variant="headlineSm" accessibilityRole="header">
              {title}
            </ThemedText>
            <IconButton icon="close" label="Close" tile={false} onPress={onClose} />
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(27, 27, 33, 0.4)',
  },
  sheet: {
    width: '100%',
    maxWidth: Layout.mobileMaxWidth,
    gap: Spacing.lg,
    padding: Spacing.xl,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
