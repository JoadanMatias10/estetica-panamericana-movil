import { Stack } from 'expo-router';

import { palette } from '@/shared/theme/tokens';

export default function StylistLayout() {
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: palette.background },
        headerShown: false,
      }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
