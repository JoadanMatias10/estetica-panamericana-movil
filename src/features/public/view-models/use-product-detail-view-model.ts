import { useCallback, useRef, useState } from 'react';
import { Share } from 'react-native';
import { getProduct, type PublicApiLoadOptions } from '../services/public-api-service';
import { formatProductPrice, productAvailability } from '../models/public-product';
import { usePublicApiResource } from './use-public-api-resource';

export function useProductDetailViewModel(id?: string) {
  const load = useCallback(async (options?: PublicApiLoadOptions) => ({
    product: id ? await getProduct(id, options) : undefined,
  }), [id]);
  const { data, ...resource } = usePublicApiResource(load);
  const product = data?.product;
  const [shareError, setShareError] = useState<string>();
  const [isSharing, setIsSharing] = useState(false);
  const sharing = useRef(false);
  const onShare = useCallback(async () => {
    if (!product || sharing.current) return;
    sharing.current = true;
    setIsSharing(true);
    setShareError(undefined);
    try {
      await Share.share({
        title: `${product.brand} · ${product.name}`,
        message: `${product.brand} · ${product.name}\n${product.presentation} · ${formatProductPrice(product.price)} MXN\nEstética Panamericana`,
      });
    } catch {
      setShareError('No pudimos abrir las opciones para compartir. Inténtalo nuevamente.');
    } finally {
      sharing.current = false;
      setIsSharing(false);
    }
  }, [product]);
  return {
    ...resource,
    product, quantity: 1, canChangeQuantity: false as const,
    availability: productAvailability(product?.stock), shareError, isSharing,
    onShare: () => { void onShare(); },
  };
}
