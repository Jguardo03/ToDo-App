import { Stack } from 'expo-router';

import { useSession } from '@/context/session';

/** Signed out: only the sign-in screen. Signed in: the app, and the sign-in screen is unreachable. */
export function RootNavigator() {
  const { status } = useSession();
  if (status === 'loading') return null;
  const signedIn = status === 'signed-in';

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="task/new" />
        <Stack.Screen name="status/[status]" />
      </Stack.Protected>
    </Stack>
  );
}
