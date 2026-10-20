import { useLocalSearchParams, useRouter } from 'expo-router';

import { getServicesCatalog } from '@/features/public/services/public-api-service';
import { useServiceDetailViewModel } from '@/features/public/view-models/use-service-detail-view-model';
import { ServiceDetailScreen } from '@/features/public/views/service-detail-screen';

export async function generateStaticParams() {
  const { services } = await getServicesCatalog();
  return services.map((service) => ({ id: service.id }));
}

export default function ServiceDetailPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const detail = useServiceDetailViewModel(Array.isArray(id) ? id[0] : id);

  return (
    <ServiceDetailScreen
      {...detail}
      onBack={() => router.dismissTo('/public/services')}
      onLogin={() => router.push('/public/login')}
      onViewServices={() => router.dismissTo('/public/services')}
    />
  );
}
