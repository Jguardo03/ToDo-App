import { Stack } from 'expo-router';

import { useSession } from '@/context/session';

/**
 * Signed out: only the sign-in screen. Signed in: the app, and the sign-in screen is unreachable.
 * Every screen that needs a signed-in user must be listed under the signed-in guard, or it could be opened
 * by address while signed out.
 */
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
        <Stack.Screen name="task/[id]/index" />
        <Stack.Screen name="task/[id]/edit" />
        <Stack.Screen name="task/[id]/subtask-new" />
        <Stack.Screen name="task/[id]/subtask/[subtaskId]" />
        <Stack.Screen name="status/[status]" />
      </Stack.Protected>
    </Stack>
  );
}
