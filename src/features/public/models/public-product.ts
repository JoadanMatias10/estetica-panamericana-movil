import type { ImageSourcePropType } from 'react-native';

export type ProductImage = ImageSourcePropType;

export type ProductCategory = {
  id: string;
  label: string;
};

export type PublicProduct = {
  id: string;
  name: string;
  brand: string;
  categoryId: string;
  categoryLabel: string;
  presentation: string;
  price: number;
  stock?: number;
  rating?: number;
  images: ProductImage[];
  description: string;
  features: string[];
  usage: string;
  featured: boolean;
};

export type ProductAvailability = 'available' | 'sold-out' | 'unknown';

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

export function formatProductPrice(price: number) {
  return currencyFormatter.format(Number.isFinite(price) ? Math.max(0, price) : 0);
}

export function productAvailability(stock?: number): ProductAvailability {
  if (!Number.isFinite(stock)) return 'unknown';
  return Number(stock) > 0 ? 'available' : 'sold-out';
}

export function filterProducts(
  products: readonly PublicProduct[],
  query: string,
  categoryId: string,
) {
  const normalizedQuery = normalizeSearchText(query);

  return products.filter((product) => {
    if (categoryId !== 'all' && product.categoryId !== categoryId) return false;
    if (!normalizedQuery) return true;

    return normalizeSearchText([
      product.name,
      product.brand,
      product.categoryLabel,
      product.presentation,
      product.description,
    ].join(' ')).includes(normalizedQuery);
  });
}
