import '@/global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { palette } from '@/shared/theme/tokens';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: palette.background },
          headerShown: false,
        }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="public" />
        <Stack.Screen name="client" />
        <Stack.Screen name="stylist" />
      </Stack>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
