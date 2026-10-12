import { useCallback, useRef, useState } from 'react';
import { Share } from 'react-native';

import type { PublicPromotion } from '../models/public-content';
import { getPromotions } from '../services/public-api-service';
import { usePublicApiResource } from './use-public-api-resource';

export function usePromotionsViewModel() {
  const resource = usePublicApiResource(getPromotions);
  const [isSharingId, setIsSharingId] = useState<string>();
  const [shareError, setShareError] = useState<string>();
  const sharing = useRef(false);
  const promotions = resource.data ?? [];

  const onShare = useCallback(async (promotion: PublicPromotion) => {
    if (sharing.current) return;
    sharing.current = true;
    setIsSharingId(promotion.id);
    setShareError(undefined);
    try {
      const details = [promotion.title, promotion.discount, promotion.description]
        .map((value) => value.trim())
        .filter(Boolean)
        .join('\n');
      await Share.share({
        title: promotion.title,
        message: `${details}\nEstética Panamericana`,
      });
    } catch {
      setShareError('No se pudieron abrir las opciones para compartir. Inténtalo nuevamente.');
    } finally {
      sharing.current = false;
      setIsSharingId(undefined);
    }
  }, []);

  const status = resource.isLoading && !resource.data
    ? 'loading'
    : resource.error && !resource.data
      ? 'error'
      : 'ready';

  return {
    errorMessage: resource.error,
    isSharingId,
    promotions,
    shareError,
    status: status as 'error' | 'loading' | 'ready',
    onRetry: resource.onRetry,
    onShare: (promotion: PublicPromotion) => { void onShare(promotion); },
  };
}
