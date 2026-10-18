import { Redirect, Stack } from 'expo-router';

/** Dev-only: the component gallery does not exist in production builds. */
export default function GalleryLayout() {
  if (!__DEV__) return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: true, headerTitleStyle: { fontFamily: 'Sora_600SemiBold' } }} />;
}
