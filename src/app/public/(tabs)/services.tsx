import { useRouter } from 'expo-router';
import { ServicesScreen } from '@/features/public/views/services-screen';
import { useServicesViewModel } from '@/features/public/view-models/use-services-view-model';

export default function PublicServicesScreen() {
  const router = useRouter();
  const services = useServicesViewModel();
  return <ServicesScreen {...services} onLogin={() => router.push('/public/login')} />;
}
