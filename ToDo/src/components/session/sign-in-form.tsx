import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { TextField } from '@/components/ui/text-field';
import { ThemedText } from '@/components/themed-text';
import { Colors, Layout, Spacing } from '@/constants/theme';
import { validateUsername } from '@/domain/validation';
import type { SignInMode, SignInResult } from '@/context/session';

type SignInFormProps = {
  /** Usernames used on this device, newest first. */
  recent: readonly string[];
  onSubmit: (rawUsername: string, mode: SignInMode) => Promise<SignInResult>;
};

/** Username entry (mockups: signIn, mobile_signIn). There is no password. */
export function SignInForm({ recent, onSubmit }: SignInFormProps) {
  const [handle, setHandle] = useState('');
  const [busy, setBusy] = useState<SignInMode | null>(null);
  const [error, setError] = useState<string>();

  const parsed = validateUsername(handle);

  const submit = async (mode: SignInMode) => {
    setBusy(mode);
    setError(undefined);
    const result = await onSubmit(handle, mode);
    setBusy(null);
    if (!result.ok) setError(result.error);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.page}>
          <View style={styles.brand}>
            <View style={styles.logo}>
              <Icon name="done" size={36} color="onPrimary" />
            </View>
            <ThemedText variant="headlineXl" accessibilityRole="header" style={styles.centered}>
              Welcome to ToDo
            </ThemedText>
            <ThemedText variant="bodyLg" color="onSurfaceVariant" style={styles.centered}>
              No password needed. Pick a unique handle and your tasks, categories and calendar are saved under it.
            </ThemedText>
          </View>

          <Card style={styles.stack}>
            <View style={styles.spread}>
              <ThemedText variant="headlineSm">Unique Handle</ThemedText>
              {parsed.ok ? <Chip label="Ready" background="secondaryContainer" foreground="onSecondaryContainer" /> : null}
            </View>
            <TextField
              accessibilityLabel="Unique handle"
              prefix="@"
              value={handle}
              onChangeText={setHandle}
              placeholder="rune_dev"
              autoCapitalize="none"
              autoCorrect={false}
              error={error}
              returnKeyType="go"
              onSubmitEditing={() => submit('returning')}
            />
            <ThemedText variant="bodySm" color="onSurfaceVariant">
              3 to 20 letters, numbers or underscores.
            </ThemedText>
          </Card>

          <View style={styles.stack}>
            <Button
              label="Returning User"
              icon="forward"
              loading={busy === 'returning'}
              disabled={busy !== null}
              onPress={() => submit('returning')}
            />
            <ThemedText variant="bodySm" color="onSurfaceVariant" style={styles.centered}>
              Open the list that already exists under this handle.
            </ThemedText>
            <Button
              label="New User"
              variant="secondary"
              icon="add"
              loading={busy === 'new'}
              disabled={busy !== null}
              onPress={() => submit('new')}
            />
            <ThemedText variant="bodySm" color="onSurfaceVariant" style={styles.centered}>
              Create a new list with this handle.
            </ThemedText>
          </View>

          {recent.length > 0 ? (
            <Card tone="muted" style={styles.stack}>
              <ThemedText variant="labelXs" color="onSurfaceVariant" accessibilityRole="header">
                Previously active on this device
              </ThemedText>
              <View style={styles.chips}>
                {recent.map((name) => (
                  <Chip
                    key={name}
                    size="md"
                    label={`@${name}`}
                    background="surfaceContainerLowest"
                    foreground="onSurface"
                    onPress={() => {
                      setHandle(name);
                      setError(undefined);
                    }}
                  />
                ))}
              </View>
            </Card>
          ) : null}

          <View style={styles.notice}>
            <Icon name="lock" size={14} color="secondary" />
            <ThemedText variant="bodySm" color="onSurfaceVariant" style={styles.noticeText}>
              A handle is not a password: anyone who knows it can open that list. Keep private information out of your
              tasks. Your handle is remembered on this device only.
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.margin,
  },
  page: {
    width: '100%',
    maxWidth: Layout.mobileMaxWidth,
    gap: Spacing.xl,
  },
  brand: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  logo: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: Colors.primary,
  },
  centered: {
    textAlign: 'center',
  },
  stack: {
    gap: Spacing.md,
  },
  spread: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  noticeText: {
    flex: 1,
  },
});
