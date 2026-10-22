import { useCallback, useRef, useState } from 'react';
import { Share } from 'react-native';

import { formatServicePrice, type PublicServiceDetail } from '../models/public-service';
import { getService, type PublicApiLoadOptions } from '../services/public-api-service';
import { usePublicApiResource } from './use-public-api-resource';

export function useServiceDetailViewModel(id?: string) {
  const load = useCallback(async (options?: PublicApiLoadOptions) => ({
    service: id ? await getService(id, options) : undefined,
  }), [id]);
  const resource = usePublicApiResource(load);
  const [imageSelection, setImageSelection] = useState({ serviceId: '', index: 0 });
  const [shareError, setShareError] = useState<string>();
  const [isSharing, setIsSharing] = useState(false);
  const sharing = useRef(false);
  const source = resource.data?.service;

  const service: PublicServiceDetail | undefined = source ? {
    category: source.subcategory || source.segment,
    description: source.description,
    durationText: source.durationLabel,
    gallery: source.images,
    id: source.id,
    image: source.image,
    name: source.name,
    priceFrom: source.priceFrom,
    segment: source.segment,
    subcategory: source.subcategory,
  } : undefined;

  const onShare = useCallback(async () => {
    if (!source || sharing.current) return;
    sharing.current = true;
    setIsSharing(true);
    setShareError(undefined);
    try {
      await Share.share({
        title: source.name,
        message: `${source.name}\nDesde ${formatServicePrice(source.priceFrom)} MXN${source.durationLabel ? `\nDuración aproximada: ${source.durationLabel}` : ''}\nEstética Panamericana`,
      });
    } catch {
      setShareError('No se pudieron abrir las opciones para compartir. Inténtalo nuevamente.');
    } finally {
      sharing.current = false;
      setIsSharing(false);
    }
  }, [source]);

  const status = resource.isLoading && !resource.data
    ? 'loading'
    : resource.error && !service
      ? 'error'
      : !service
        ? 'not-found'
        : 'ready';

  const selectedImageIndex = imageSelection.serviceId === source?.id ? imageSelection.index : 0;

  return {
    errorMessage: resource.error,
    isSharing,
    selectedImageIndex,
    service,
    shareError,
    status: status as 'error' | 'loading' | 'not-found' | 'ready',
    onRetry: resource.onRetry,
    onSelectImage: (index: number) => setImageSelection({ serviceId: source?.id ?? '', index }),
    onShare: () => { void onShare(); },
  };
}
