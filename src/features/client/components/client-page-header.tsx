import { useRouter } from 'expo-router';

import { ClientHeader } from '@/features/client/components/client-header';
import { useClientCartViewModel } from '@/features/client/view-models/use-client-cart-view-model';

type ClientPageHeaderProps = {
  back?: boolean;
  showCart?: boolean;
  showNotifications?: boolean;
  subtitle?: string;
  title: string;
};

export function ClientPageHeader({
  back = false,
  showCart = true,
  showNotifications = true,
  subtitle,
  title,
}: ClientPageHeaderProps) {
  const router = useRouter();
  const { cart } = useClientCartViewModel();

  return (
    <ClientHeader
      cartCount={cart.totalQuantity}
      onBack={back ? () => router.back() : undefined}
      onCart={showCart ? () => router.push('/client/products/cart') : undefined}
      onNotifications={showNotifications ? () => router.push('/client/profile/notifications') : undefined}
      subtitle={subtitle}
      title={title}
    />
  );
}
