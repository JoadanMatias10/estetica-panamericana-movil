import { useCallback, useRef, useState } from 'react';
import { Share } from 'react-native';
import { getProduct } from '../data/catalog-api';
import { formatProductPrice, productAvailability } from '../models/public-product';
import { useCatalogResource } from './use-catalog-resource';

export function useProductDetailViewModel(id?: string) {
  const load = useCallback(async () => ({ product: id ? await getProduct(id) : undefined }), [id]);
  const { data, ...resource } = useCatalogResource(load);
  const product = data?.product;
  const isPreview = false;
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
        message: `${product.brand} · ${product.name}\n${product.presentation} · ${formatProductPrice(product.price)} MXN\nEstética Panamericana${isPreview ? '\nProducto de ejemplo: precio y disponibilidad por confirmar.' : ''}`,
      });
    } catch {
      setShareError('No pudimos abrir las opciones para compartir. Inténtalo nuevamente.');
    } finally {
      sharing.current = false;
      setIsSharing(false);
    }
  }, [product, isPreview]);
  return {
    ...resource,
    product, isPreview, quantity: 1, canChangeQuantity: false as const,
    availability: productAvailability(product?.stock), shareError, isSharing,
    onShare: () => { void onShare(); },
  };
}
