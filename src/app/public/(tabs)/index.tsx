import { useRouter } from 'expo-router';

import { usePublicHomeViewModel } from '@/features/public/view-models/use-public-home-view-model';
import { PublicHomeScreen } from '@/features/public/views/public-home-screen';

export default function PublicHomePage() {
  const router = useRouter();
  const home = usePublicHomeViewModel();

  return (
    <PublicHomeScreen
      {...home}
      logo={require('../../../../assets/images/brand-logo.png')}
      onLogin={() => router.push('/public/login')}
      onServices={() => router.push('/public/services')}
      onProducts={() => router.push('/public/products')}
      onAbout={() => router.push('/public/more/about')}
      onContact={() => router.push('/public/more/contact')}
      onPrivacy={() => router.push('/public/more/privacy')}
      onPromotions={() => router.push('/public/more/promotions')}
    />
  );
}
