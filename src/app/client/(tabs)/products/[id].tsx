import { useLocalSearchParams } from 'expo-router';

import { ClientProductDetailScreen } from '@/features/client/views/client-products-screens';

export default function ClientProductDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  return <ClientProductDetailScreen productId={Array.isArray(id) ? id[0] : id} />;
}
