import { useMemo, useState } from 'react';
import { getServicesCatalog } from '../data/catalog-api';
import {
  countServiceFilters, emptyServiceFilters, filterServices,
  type PublicService, type ServiceCategory, type ServiceFilters,
} from '../models/public-service';
import { useCatalogResource } from './use-catalog-resource';

const emptyServices: readonly PublicService[] = [];
const emptyCategories: readonly ServiceCategory[] = [{ id: 'all', label: 'Todos' }];

export function useServicesViewModel() {
  const { data, ...resource } = useCatalogResource(getServicesCatalog);
  const services = data?.services ?? emptyServices;
  const [query, setQuery] = useState('');
  const [selectedCategoryId, setCategoryId] = useState('all');
  const [filters, setFilters] = useState<ServiceFilters>(emptyServiceFilters);
  const [draftFilters, setDraftFilters] = useState<ServiceFilters>(emptyServiceFilters);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [selectedService, setSelectedService] = useState<PublicService | null>(null);
  const categories = data?.categories ?? emptyCategories;
  const categoryId = categories.some(category => category.id === selectedCategoryId) ? selectedCategoryId : 'all';
  const filteredServices = useMemo(
    () => filterServices(services, query, categoryId, filters, categories),
    [services, query, categoryId, filters, categories],
  );

  return {
    ...resource,
    services: filteredServices, categories, query, categoryId,
    isPreview: false,
    hasActiveSearch: !!query.trim() || categoryId !== 'all' || countServiceFilters(filters) > 0,
    activeFilterCount: countServiceFilters(filters),
    filtersVisible, draftFilters,
    selectedService: services.find(service => service.id === selectedService?.id) ?? null,
    onQueryChange: setQuery,
    onCategoryChange: setCategoryId,
    onOpenFilters: () => { setDraftFilters({ ...filters }); setFiltersVisible(true); },
    onCloseFilters: () => setFiltersVisible(false),
    onToggleFilter: (key: keyof ServiceFilters) => setDraftFilters(current => ({ ...current, [key]: !current[key] })),
    onClearDraftFilters: () => setDraftFilters({ ...emptyServiceFilters }),
    onApplyFilters: () => { setFilters({ ...draftFilters }); setFiltersVisible(false); },
    onResetSearch: () => { setQuery(''); setCategoryId('all'); setFilters({ ...emptyServiceFilters }); },
    onDetail: setSelectedService,
    onCloseDetail: () => setSelectedService(null),
  };
}
