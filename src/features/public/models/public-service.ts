import type { ImageSourcePropType } from 'react-native';

export type ServiceCategory = {
  id: string;
  label: string;
  segment?: string;
  subcategory?: string;
};

export type PublicService = {
  id: string;
  name: string;
  categoryId: string;
  segment: string;
  subcategory: string;
  description: string;
  priceFrom: number;
  durationLabel: string;
  durationMinutes?: number;
  image?: ImageSourcePropType;
  images: ImageSourcePropType[];
  featured: boolean;
};

export type PublicServiceDetail = {
  category?: string;
  description?: string;
  durationText?: string;
  gallery?: readonly ImageSourcePropType[];
  id: string;
  image?: ImageSourcePropType;
  name: string;
  priceFrom?: number;
  segment?: string;
  subcategory?: string;
};

export type ServiceFilters = {
  affordable: boolean;
  short: boolean;
};

export const emptyServiceFilters: ServiceFilters = {
  affordable: false,
  short: false,
};

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  currency: 'MXN',
  currencyDisplay: 'narrowSymbol',
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: 'currency',
});

function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es-MX')
    .trim();
}

export function formatServicePrice(price: number) {
  return currencyFormatter.format(Number.isFinite(price) ? Math.max(0, price) : 0);
}

export function formatServiceDuration(service: PublicService) {
  if (service.durationLabel.trim()) return service.durationLabel.trim();
  if (Number.isFinite(service.durationMinutes)) return `${service.durationMinutes} min`;
  return 'Por confirmar';
}

export function countServiceFilters(filters: ServiceFilters) {
  return Number(filters.affordable) + Number(filters.short);
}

export function filterServices(
  services: readonly PublicService[],
  query: string,
  categoryId: string,
  filters: ServiceFilters,
  _categories: readonly ServiceCategory[],
) {
  const normalizedQuery = normalizeSearchText(query);

  return services.filter((service) => {
    if (categoryId !== 'all' && service.categoryId !== categoryId) return false;
    if (filters.affordable && service.priceFrom > 500) return false;
    if (filters.short && (!Number.isFinite(service.durationMinutes) || Number(service.durationMinutes) > 45)) {
      return false;
    }
    if (!normalizedQuery) return true;

    return normalizeSearchText([
      service.name,
      service.segment,
      service.subcategory,
      service.description,
    ].join(' ')).includes(normalizedQuery);
  });
}
