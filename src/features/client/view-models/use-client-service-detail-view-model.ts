import { useCallback, useEffect, useState } from 'react';

import type { PublicServiceDetail } from '@/features/public/models/public-service';
import { getService } from '@/features/public/services/public-api-service';
import { getClientErrorMessage } from '@/features/client/components/client-appointment-helpers';

export function useClientServiceDetailViewModel(serviceId: string) {
  const [service, setService] = useState<PublicServiceDetail>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!serviceId) {
      setError('No se indicó el servicio que deseas consultar.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const result = await getService(serviceId);
      setService(result ? {
        ...result,
        durationText: result.durationLabel,
        gallery: result.images,
      } : undefined);
    } catch (loadError) {
      setError(getClientErrorMessage(loadError, 'No se pudo cargar el servicio.'));
    } finally {
      setIsLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    const request = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(request);
  }, [load]);

  return { error, isLoading, retry: load, service };
}
