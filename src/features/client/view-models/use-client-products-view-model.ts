import { useCallback, useEffect, useMemo, useState } from 'react';

import { getClientErrorMessage } from '@/features/client/components/client-appointment-helpers';
import { filterProducts, type ProductCategory, type PublicProduct } from '@/features/public/models/public-product';
import { getProductsCatalog } from '@/features/public/services/public-api-service';

export function useClientProductsViewModel() {
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([{ id: 'all', label: 'Todos' }]);
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
      const catalog = await getProductsCatalog({ forceRefresh: refresh });
      setProducts(catalog.products);
      setCategories(catalog.categories);
    } catch (loadError) {
      setError(getClientErrorMessage(loadError, 'No se pudo cargar el catálogo de productos.'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const request = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(request);
  }, [load]);

  return {
    categories,
    categoryId,
    error,
    isLoading,
    isRefreshing,
    products: useMemo(() => filterProducts(products, query, categoryId), [categoryId, products, query]),
    query,
    refresh: () => load(true),
    reset: () => { setQuery(''); setCategoryId('all'); },
    retry: () => load(false),
    setCategoryId,
    setQuery,
  };
}
