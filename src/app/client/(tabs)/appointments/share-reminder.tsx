import { useLocalSearchParams } from 'expo-router';

import { ClientShareReminderScreen } from '@/features/client/views/client-profile-screens';

export default function ClientShareReminderRoute() {
  const { appointmentId } = useLocalSearchParams<{ appointmentId?: string | string[] }>();
  return <ClientShareReminderScreen appointmentId={Array.isArray(appointmentId) ? appointmentId[0] : appointmentId} />;
}
