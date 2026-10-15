import { useLocalSearchParams } from 'expo-router';

import { ClientScheduleAppointmentScreen } from '@/features/client/views/client-appointments-screens';

function value(parameter?: string | string[]) {
  return Array.isArray(parameter) ? parameter[0] : parameter;
}

export default function ClientScheduleAppointmentRoute() {
  const parameters = useLocalSearchParams<{ date?: string; serviceId?: string; stylistId?: string; time?: string }>();
  return <ClientScheduleAppointmentScreen date={value(parameters.date)} serviceId={value(parameters.serviceId)} stylistId={value(parameters.stylistId)} time={value(parameters.time)} />;
}
