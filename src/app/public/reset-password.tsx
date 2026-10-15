import { useLocalSearchParams } from 'expo-router';

import { ResetPasswordScreen } from '@/features/public/auth/views/reset-password-screen';

export default function ResetPasswordRoute() {
  const { token } = useLocalSearchParams<{ token?: string | string[] }>();
  const resetToken = Array.isArray(token) ? token[0] || '' : token || '';

  return <ResetPasswordScreen token={resetToken} />;
}
