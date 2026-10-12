import { useRouter } from 'expo-router';

import { useAboutViewModel } from '@/features/public/view-models/use-about-view-model';
import { AboutScreen } from '@/features/public/views/about-screen';

export default function AboutPage() {
  const router = useRouter();
  const about = useAboutViewModel();

  return (
    <AboutScreen
      {...about}
      logo={require('../../../../../assets/images/brand-logo.png')}
      onBack={() => {
        if (router.canGoBack()) router.back();
        else router.replace('/public/more');
      }}
      onContact={() => router.push('/public/more/contact')}
      onPrivacy={() => router.push('/public/more/privacy')}
    />
  );
}
