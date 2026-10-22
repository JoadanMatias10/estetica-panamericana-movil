import { useCallback, useEffect, useState } from 'react';
import type { ImageSourcePropType } from 'react-native';

import { getClientErrorMessage } from '@/features/client/components/client-appointment-helpers';
import { clientCartStore } from '@/features/client/services/client-cart-store';
import type { PublicProduct } from '@/features/public/models/public-product';
import { getProduct } from '@/features/public/services/public-api-service';

function remoteImageUrl(source?: ImageSourcePropType) {
  if (!source || typeof source === 'number' || Array.isArray(source)) return undefined;
  return typeof source.uri === 'string' ? source.uri : undefined;
}

export function useClientProductDetailViewModel(productId: string) {
  const [product, setProduct] = useState<PublicProduct>();
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try { setProduct(await getProduct(productId)); }
    catch (loadError) { setError(getClientErrorMessage(loadError, 'No se pudo cargar el producto.')); }
    finally { setIsLoading(false); }
  }, [productId]);

  useEffect(() => {
    const request = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(request);
  }, [load]);

  const stock = Math.max(0, Math.floor(product?.stock ?? 0));
  const addToCart = useCallback(async () => {
    if (!product || stock <= 0 || isAdding) return false;
    setIsAdding(true);
    setActionError('');
    try {
      await clientCartStore.add({
        imageUrl: remoteImageUrl(product.images[0]),
        name: product.name,
        presentation: product.presentation,
        productId: product.id,
        stock,
        unitPrice: product.price,
      }, quantity);
      return true;
    } catch (addError) {
      setActionError(getClientErrorMessage(addError, 'No se pudo agregar el producto.'));
      return false;
    } finally { setIsAdding(false); }
  }, [isAdding, product, quantity, stock]);

  return {
    actionError,
    addToCart,
    canAdd: Boolean(product && stock > 0),
    decrement: () => setQuantity((current) => Math.max(1, current - 1)),
    error,
    increment: () => setQuantity((current) => Math.min(Math.max(1, stock), current + 1)),
    isAdding,
    isLoading,
    product,
    quantity,
    retry: load,
    stock,
  };
}
