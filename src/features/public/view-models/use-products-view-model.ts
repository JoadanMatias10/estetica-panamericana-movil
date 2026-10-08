import { useMemo, useState } from 'react';
import { getProductsCatalog } from '../data/catalog-api';
import { filterProducts, type ProductCategory, type PublicProduct } from '../models/public-product';
import { useCatalogResource } from './use-catalog-resource';

const emptyProducts: readonly PublicProduct[] = [];
const emptyCategories: readonly ProductCategory[] = [{ id: 'all', label: 'Todos' }];

export function useProductsViewModel() {
  const { data, ...resource } = useCatalogResource(getProductsCatalog);
  const products = data?.products ?? emptyProducts;
  const categories = data?.categories ?? emptyCategories;
  const [query, setQuery] = useState('');
  const [selectedCategoryId, setCategoryId] = useState('all');
  const categoryId = categories.some(category => category.id === selectedCategoryId) ? selectedCategoryId : 'all';
  const filtered = useMemo(() => filterProducts(products, query, categoryId), [products, query, categoryId]);
  return {
    ...resource,
    products: filtered, categories, query, categoryId, isPreview: false,
    hasActiveSearch: !!query.trim() || categoryId !== 'all',
    onQueryChange: setQuery, onCategoryChange: setCategoryId,
    onResetSearch: () => { setQuery(''); setCategoryId('all'); },
  };
}
