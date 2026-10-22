/// <reference types="jest" />
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { clientCartStore } from '../src/features/client/services/client-cart-store';
import { useClientProductDetailViewModel } from '../src/features/client/view-models/use-client-product-detail-view-model';
import { useClientProductsViewModel } from '../src/features/client/view-models/use-client-products-view-model';
import { useClientServiceDetailViewModel } from '../src/features/client/view-models/use-client-service-detail-view-model';
import { useClientServicesViewModel } from '../src/features/client/view-models/use-client-services-view-model';
import type { PublicProduct } from '../src/features/public/models/public-product';
import type { PublicService } from '../src/features/public/models/public-service';
import { getProduct, getProductsCatalog, getService, getServicesCatalog } from '../src/features/public/services/public-api-service';

jest.mock('../src/features/public/services/public-api-service', () => ({
  getProduct: jest.fn(), getProductsCatalog: jest.fn(), getService: jest.fn(), getServicesCatalog: jest.fn(),
}));
jest.mock('../src/features/client/services/client-cart-store', () => ({
  clientCartStore: { add: jest.fn() },
}));

const product: PublicProduct = {
  id: 'p-1', name: 'Shampoo', brand: 'Marca', categoryId: 'hair', categoryLabel: 'Cabello',
  presentation: '250 ml', price: 120, stock: 2, images: [{ uri: 'https://example.test/image.png' }],
  description: '', features: [], usage: '', featured: false,
};
const service: PublicService = {
  id: 's-1', name: 'Corte', categoryId: 'hair', segment: 'Cabello', subcategory: 'Corte',
  description: '', priceFrom: 250, durationLabel: '30 min', images: [], featured: false,
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(getProductsCatalog).mockResolvedValue({ products: [product], categories: [{ id: 'all', label: 'Todos' }, { id: 'hair', label: 'Cabello' }] });
  jest.mocked(getServicesCatalog).mockResolvedValue({ services: [service], categories: [{ id: 'all', label: 'Todos' }, { id: 'hair', label: 'Cabello' }] });
  jest.mocked(getProduct).mockResolvedValue(product);
  jest.mocked(getService).mockResolvedValue(service);
  jest.mocked(clientCartStore.add).mockResolvedValue({
    distinctItemCount: 1, isHydrated: true, items: [], subtotal: 0, totalQuantity: 0,
  });
});

describe('catálogos y detalle del cliente', () => {
  it('carga productos, filtra por texto y recupera todos al restablecer', async () => {
    const { result } = renderHook(() => useClientProductsViewModel());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.products).toEqual([product]);
    act(() => result.current.setQuery('sin coincidencias'));
    expect(result.current.products).toEqual([]);
    act(() => result.current.reset());
    expect(result.current.products).toEqual([product]);
    await act(async () => result.current.refresh());
    expect(getProductsCatalog).toHaveBeenLastCalledWith({ forceRefresh: true });
  });

  it('conserva los productos cargados cuando falla una actualización', async () => {
    const { result } = renderHook(() => useClientProductsViewModel());
    await waitFor(() => expect(result.current.products).toHaveLength(1));
    jest.mocked(getProductsCatalog).mockRejectedValueOnce(new Error('Sin conexión'));
    await act(async () => result.current.refresh());
    expect(result.current.error).toBe('Sin conexión');
    expect(result.current.products).toEqual([product]);
  });

  it('filtra servicios y permite recuperar un error de carga', async () => {
    jest.mocked(getServicesCatalog).mockRejectedValueOnce(new Error('Servidor no disponible'));
    const { result } = renderHook(() => useClientServicesViewModel());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe('Servidor no disponible');
    await act(async () => result.current.retry());
    expect(result.current.services).toEqual([service]);
    act(() => result.current.setQuery('otro'));
    expect(result.current.services).toEqual([]);
    act(() => result.current.reset());
    expect(result.current.services).toEqual([service]);
  });

  it('limita la cantidad al stock y envía el producto real al carrito', async () => {
    const { result } = renderHook(() => useClientProductDetailViewModel('p-1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => { result.current.increment(); result.current.increment(); });
    expect(result.current.quantity).toBe(2);
    await act(async () => expect(await result.current.addToCart()).toBe(true));
    expect(clientCartStore.add).toHaveBeenCalledWith(expect.objectContaining({
      productId: 'p-1', stock: 2, unitPrice: 120, imageUrl: 'https://example.test/image.png',
    }), 2);
  });

  it('no agrega productos agotados y comunica un fallo de almacenamiento', async () => {
    jest.mocked(getProduct).mockResolvedValueOnce({ ...product, stock: 0 });
    const soldOut = renderHook(() => useClientProductDetailViewModel('p-1'));
    await waitFor(() => expect(soldOut.result.current.isLoading).toBe(false));
    expect(soldOut.result.current.canAdd).toBe(false);
    await act(async () => expect(await soldOut.result.current.addToCart()).toBe(false));
    expect(clientCartStore.add).not.toHaveBeenCalled();
    soldOut.unmount();

    jest.mocked(clientCartStore.add).mockRejectedValueOnce(new Error('No se pudo guardar'));
    const available = renderHook(() => useClientProductDetailViewModel('p-1'));
    await waitFor(() => expect(available.result.current.isLoading).toBe(false));
    await act(async () => expect(await available.result.current.addToCart()).toBe(false));
    expect(available.result.current.actionError).toBe('No se pudo guardar');
  });

  it('rechaza un detalle de servicio sin identificador y no consulta la API', async () => {
    const { result } = renderHook(() => useClientServiceDetailViewModel(''));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toContain('No se indicó el servicio');
    expect(getService).not.toHaveBeenCalled();
  });

  it('carga el detalle de servicio con su duración y galería', async () => {
    const { result } = renderHook(() => useClientServiceDetailViewModel('s-1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.service).toMatchObject({ id: 's-1', durationText: '30 min', gallery: [] });
  });
});
