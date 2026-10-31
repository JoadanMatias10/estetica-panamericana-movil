import { useRouter } from 'expo-router';

import { AccountDeletionScreen } from '@/features/client/views/account-deletion-screen';

export default function DeleteAccountRoute() {
  const router = useRouter();
  const onHome = () => router.replace('/public');
  return <AccountDeletionScreen onBack={() => router.canGoBack() ? router.back() : onHome()} onHome={onHome} />;
}
