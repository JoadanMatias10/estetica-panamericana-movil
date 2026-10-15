import { useLocalSearchParams } from 'expo-router';

import { ClientRescheduleAppointmentScreen } from '@/features/client/views/client-appointments-screens';

export default function ClientRescheduleAppointmentRoute() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  return <ClientRescheduleAppointmentScreen appointmentId={Array.isArray(id) ? id[0] : id} />;
}
