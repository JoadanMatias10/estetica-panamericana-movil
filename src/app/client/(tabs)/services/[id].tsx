import { useLocalSearchParams } from 'expo-router';

import { ClientServiceDetailScreen } from '@/features/client/views/client-services-screens';

export default function ClientServiceDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  return <ClientServiceDetailScreen serviceId={Array.isArray(id) ? id[0] : id} />;
}
