import { useRouter } from 'expo-router';
import { PublicHomeScreen } from '../../../features/public/views/public-home-screen';

export default function PublicHomePage() {
  const router = useRouter();

  return (
    <PublicHomeScreen
      onLogin={() => router.push('/public/login')}
      onServices={() => router.push('/public/services')}
      onProducts={() => router.push('/public/products')}
      onMore={() => router.push('/public/more')}
      onAbout={() => router.push('/public/about')}
      onContact={() => router.push('/public/more/contact')}
    />
  );
}