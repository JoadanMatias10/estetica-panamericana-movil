import { useRouter } from 'expo-router';

import { useServicesViewModel } from '@/features/public/view-models/use-services-view-model';
import { ServicesScreen } from '@/features/public/views/services-screen';

export default function PublicServicesPage() {
  const router = useRouter();
  const services = useServicesViewModel();

  return (
    <ServicesScreen
      {...services}
      onLogin={() => router.push('/public/login')}
      onDetail={(service) => router.push({
        pathname: '/public/services/[id]',
        params: { id: service.id },
      })}
    />
  );
}
