import {
  Sora_400Regular,
  Sora_500Medium,
  Sora_600SemiBold,
  Sora_700Bold,
  useFonts,
} from '@expo-google-fonts/sora';
import { DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { RootNavigator } from '@/components/layout/root-navigator';
import { Colors } from '@/constants/theme';
import { RepositoriesProvider } from '@/context/repositories';
import { SessionProvider } from '@/context/session';

SplashScreen.preventAutoHideAsync();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary,
    background: Colors.background,
    card: Colors.surfaceContainerLowest,
    text: Colors.onSurface,
    border: Colors.outlineVariant,
  },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Sora_400Regular,
    Sora_500Medium,
    Sora_600SemiBold,
    Sora_700Bold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style="dark" />
      <RepositoriesProvider>
        <SessionProvider>
          <RootNavigator />
        </SessionProvider>
      </RepositoriesProvider>
    </ThemeProvider>
  );
}
