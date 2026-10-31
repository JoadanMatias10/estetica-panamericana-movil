import { type Href, useRouter } from 'expo-router';

import { usePrivacyViewModel } from '@/features/public/view-models/use-privacy-view-model';
import { PrivacyScreen } from '@/features/public/views/privacy-screen';

export default function PrivacyPage() {
  const router = useRouter();
  const privacy = usePrivacyViewModel();

  return (
    <PrivacyScreen
      {...privacy}
      onBack={() => {
        if (router.canGoBack()) router.back();
        else router.replace('/public/more');
      }}
      onDeleteAccount={() => router.push('/public/delete-account' as Href)}
    />
  );
}
