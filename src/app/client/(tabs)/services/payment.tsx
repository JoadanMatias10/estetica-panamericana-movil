import { useLocalSearchParams } from 'expo-router';

import { ClientServicePaymentScreen } from '@/features/client/views/client-services-screens';

function value(parameter?: string | string[]) { return Array.isArray(parameter) ? parameter[0] : parameter; }

export default function ClientServicePaymentRoute() {
  const parameters = useLocalSearchParams<{ appointmentId?: string; serviceId?: string }>();
  return <ClientServicePaymentScreen appointmentId={value(parameters.appointmentId)} serviceId={value(parameters.serviceId)} />;
}
