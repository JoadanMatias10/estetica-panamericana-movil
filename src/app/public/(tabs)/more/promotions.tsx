import { useRouter } from 'expo-router';

import { usePromotionsViewModel } from '@/features/public/view-models/use-promotions-view-model';
import { PromotionsScreen } from '@/features/public/views/promotions-screen';

export default function PromotionsPage() {
  const router = useRouter();
  const promotions = usePromotionsViewModel();

  return (
    <PromotionsScreen
      {...promotions}
      onViewServices={() => router.push('/public/services')}
    />
  );
}
