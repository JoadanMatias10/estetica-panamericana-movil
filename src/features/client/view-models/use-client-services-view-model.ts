import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  filterServices,
  type PublicService,
  type ServiceCategory,
} from '@/features/public/models/public-service';
import { getServicesCatalog } from '@/features/public/services/public-api-service';
import { getClientErrorMessage } from '@/features/client/components/client-appointment-helpers';

const noFilters = { affordable: false, short: false } as const;

export function useClientServicesViewModel() {
  const [services, setServices] = useState<PublicService[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([{ id: 'all', label: 'Todos' }]);
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError('');
    try {
      const catalog = await getServicesCatalog({ forceRefresh: refresh });
      setServices(catalog.services);
      setCategories(catalog.categories);
    } catch (loadError) {
      setError(getClientErrorMessage(loadError, 'No se pudo cargar el catálogo de servicios.'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const request = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(request);
  }, [load]);

  const visibleServices = useMemo(
    () => filterServices(services, query, categoryId, noFilters, categories),
    [categories, categoryId, query, services],
  );

  return {
    categories,
    categoryId,
    error,
    isLoading,
    isRefreshing,
    query,
    refresh: () => load(true),
    reset: () => { setQuery(''); setCategoryId('all'); },
    retry: () => load(false),
    services: visibleServices,
    setCategoryId,
    setQuery,
  };
}
