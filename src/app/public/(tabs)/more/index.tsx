import { useRouter } from 'expo-router';

import { MoreScreen } from '@/features/public/views/more-screen';

export default function PublicMorePage() {
  const router = useRouter();

  return (
    <MoreScreen
      onAbout={() => router.push('/public/more/about')}
      onContact={() => router.push('/public/more/contact')}
      onLogin={() => router.push('/public/login')}
      onPrivacy={() => router.push('/public/more/privacy')}
      onPromotions={() => router.push('/public/more/promotions')}
    />
  );
}
