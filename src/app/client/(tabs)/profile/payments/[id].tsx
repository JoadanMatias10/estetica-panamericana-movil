import { useLocalSearchParams } from 'expo-router';

import { ClientPaymentDetailScreen } from '@/features/client/views/client-profile-screens';

export default function ClientPaymentDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  return <ClientPaymentDetailScreen paymentId={Array.isArray(id) ? id[0] : id} />;
}
