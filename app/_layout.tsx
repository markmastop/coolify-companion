import { useEffect } from 'react';
import { LogBox, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { CoolifyProvider } from '@/contexts/CoolifyContext';

export default function RootLayout() {
  useFrameworkReady();

  // Reduce noisy web-only warnings from dependencies while developing
  useEffect(() => {
    if (Platform.OS === 'web') {
      LogBox.ignoreLogs([
        'shadow* style props are deprecated',
        'props.pointerEvents is deprecated',
        'Unexpected text node',
      ]);
    }
  }, []);

  return (
    <CoolifyProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </CoolifyProvider>
  );
}
