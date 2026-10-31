import { useRouter } from 'expo-router';

import { RecoverPasswordScreen } from '@/features/public/auth/views/recover-password-screen';

export default function ClientChangePasswordRoute() {
  const router = useRouter();

  return (
    <RecoverPasswordScreen
      onBack={() => router.dismissTo('/client/profile')}
      returningToProfile
    />
  );
}
