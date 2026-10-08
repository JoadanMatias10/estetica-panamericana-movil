import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

import { AboutScreen as AboutView } from '@/features/public/views/about-screen';

export default function AboutPage() {
  const router = useRouter();

  return (
    <AboutView
      logo={require('../../../assets/images/brand-logo.png')}
      onBack={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/public');
        }
      }}
      onContact={() =>
        router.dismissTo('/public/more/contact')
      }
      onPrivacy={() =>
        Alert.alert('Privacidad', 'Pantalla pendiente de conectar.')
      }
      onFacebook={() =>
        Alert.alert('Facebook', 'Falta agregar el enlace oficial.')
      }
      onInstagram={() =>
        Alert.alert('Instagram', 'Falta agregar el enlace oficial.')
      }
    />
  );
}