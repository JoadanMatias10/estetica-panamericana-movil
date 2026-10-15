import { Stack } from 'expo-router';

import { ClientSessionGate } from '@/features/client/components/client-session-gate';
import { palette } from '@/shared/theme/tokens';

export default function ClientLayout() {
  return (
    <ClientSessionGate>
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: palette.background },
          headerShown: false,
        }}>
        <Stack.Screen name="complete-profile" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ClientSessionGate>
  );
}
