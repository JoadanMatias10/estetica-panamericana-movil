import { Stack } from 'expo-router';

import { StylistSessionGate } from '@/features/stylist/components/stylist-session-gate';
import { StylistProvider } from '@/features/stylist/view-models/stylist-provider';
import { palette } from '@/shared/theme/tokens';

export default function StylistLayout() {
  return (
    <StylistProvider>
      <StylistSessionGate>
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: palette.background },
            headerShown: false,
          }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      </StylistSessionGate>
    </StylistProvider>
  );
}
