import { useEffect, useSyncExternalStore } from 'react';

import { clientCartStore } from '@/features/client/services/client-cart-store';

export function useClientCartViewModel() {
  const cart = useSyncExternalStore(
    clientCartStore.subscribe,
    clientCartStore.getSnapshot,
    clientCartStore.getServerSnapshot,
  );

  useEffect(() => {
    void clientCartStore.hydrate();
  }, []);

  return {
    cart,
    addItem: clientCartStore.add,
    clearCart: clientCartStore.clear,
    removeItem: clientCartStore.remove,
    updateQuantity: clientCartStore.updateQuantity,
  };
}
