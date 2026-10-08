import { useRouter } from 'expo-router';
import { ContactScreen } from '@/features/public/views/contact-screen';
import { useContactViewModel } from '@/features/public/view-models/use-contact-view-model';

export default function ContactPage() {
  const router = useRouter();
  const contact = useContactViewModel();
  return <ContactScreen {...contact} onBack={() => {
    if (router.canGoBack()) router.back();
    else router.replace('/public/more');
  }} />;
}
