import { useLocalSearchParams } from 'expo-router';

import { ClientStylistAvailabilityScreen } from '@/features/client/views/client-appointments-screens';

function value(parameter?: string | string[]) { return Array.isArray(parameter) ? parameter[0] : parameter; }

export default function ClientStylistAvailabilityRoute() {
  const parameters = useLocalSearchParams<{ date?: string; serviceId?: string; stylistId?: string; time?: string }>();
  return <ClientStylistAvailabilityScreen date={value(parameters.date)} serviceId={value(parameters.serviceId)} stylistId={value(parameters.stylistId)} time={value(parameters.time)} />;
}
