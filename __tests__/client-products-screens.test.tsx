/// <reference types="jest" />
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Alert, Share } from 'react-native';

import {
  ClientCartScreen,
  ClientProductCheckoutScreen,
  ClientProductDetailScreen,
  ClientProductsScreen,
} from '../src/features/client/views/client-products-screens';
import { useClientCartViewModel } from '../src/features/client/view-models/use-client-cart-view-model';
import { useClientProductCheckoutViewModel } from '../src/features/client/view-models/use-client-product-checkout-view-model';
import { useClientProductDetailViewModel } from '../src/features/client/view-models/use-client-product-detail-view-model';
import { useClientProductsViewModel } from '../src/features/client/view-models/use-client-products-view-model';
import type { PublicProduct } from '../src/features/public/models/public-product';

const mockRouter = { push: jest.fn(), replace: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('../src/features/client/view-models/use-client-cart-view-model', () => ({ useClientCartViewModel: jest.fn() }));
jest.mock('../src/features/client/view-models/use-client-product-checkout-view-model', () => ({ useClientProductCheckoutViewModel: jest.fn() }));
jest.mock('../src/features/client/view-models/use-client-product-detail-view-model', () => ({ useClientProductDetailViewModel: jest.fn() }));
jest.mock('../src/features/client/view-models/use-client-products-view-model', () => ({ useClientProductsViewModel: jest.fn() }));
jest.mock('../src/features/client/components/client-page-header', () => ({
  ClientPageHeader: ({ title }: { title: string }) => {
    const { Text } = require('react-native');
    return <Text>{title}</Text>;
  },
}));
jest.mock('../src/features/public/components/product-card', () => ({
  ProductCard: ({ onDetail, product }: { onDetail: (id: string) => void; product: PublicProduct }) => {
    const { Pressable, Text } = require('react-native');
    return <Pressable onPress={() => onDetail(product.id)}><Text>{product.name}</Text></Pressable>;
  },
}));
jest.mock('../src/features/public/components/product-gallery', () => ({ ProductGallery: () => null }));
jest.mock('../src/shared/components/app-screen', () => ({
  AppScreen: ({ children }: { children: React.ReactNode }) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
}));

const product: PublicProduct = {
  id: 'p-1', name: 'Shampoo', brand: 'Marca', categoryId: 'hair', categoryLabel: 'Cabello',
  presentation: '250 ml', price: 120, stock: 3, images: [], description: 'Descripción',
  features: ['Nutre'], usage: 'Aplicar', featured: false,
};
const item = { productId: 'p-1', name: 'Shampoo', quantity: 2, stock: 3, unitPrice: 120, presentation: '250 ml' };
const cart = { isHydrated: true, items: [item], subtotal: 240, totalQuantity: 2 };
const productsVm = {
  products: [product], categories: [{ id: 'all', label: 'Todos' }, { id: 'hair', label: 'Cabello' }],
  query: '', categoryId: 'all', isLoading: false, isRefreshing: false, error: '',
  setQuery: jest.fn(), setCategoryId: jest.fn(), refresh: jest.fn(), retry: jest.fn(), reset: jest.fn(),
};
const detailVm = {
  product, quantity: 1, stock: 3, isLoading: false, isAdding: false, canAdd: true,
  error: '', actionError: '', addToCart: jest.fn(async () => true),
  increment: jest.fn(), decrement: jest.fn(), retry: jest.fn(),
};
const cartVm = { cart, clearCart: jest.fn(), removeItem: jest.fn(), updateQuantity: jest.fn() };
const checkoutVm = {
  cart, config: { bankTransfer: { bank: 'Banco', beneficiary: 'Persona', clabe: '123', isDemo: false } },
  isLoading: false, error: '', method: 'Pago en sucursal', reference: '', notes: '',
  proof: undefined, isPicking: false, isSubmitting: false, canSubmit: true, submitError: '',
  retry: jest.fn(), selectMethod: jest.fn(), setReference: jest.fn(), setNotes: jest.fn(),
  pickProof: jest.fn(), removeProof: jest.fn(), submit: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useClientProductsViewModel).mockReturnValue(productsVm);
  jest.mocked(useClientProductDetailViewModel).mockReturnValue(detailVm);
  jest.mocked(useClientCartViewModel).mockReturnValue(cartVm as unknown as ReturnType<typeof useClientCartViewModel>);
  jest.mocked(useClientProductCheckoutViewModel).mockReturnValue(checkoutVm as unknown as ReturnType<typeof useClientProductCheckoutViewModel>);
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction });
});

afterEach(() => jest.restoreAllMocks());

describe('pantallas de productos del cliente', () => {
  it('muestra el catálogo y abre el producto seleccionado', () => {
    const screen = render(<ClientProductsScreen />);
    fireEvent.press(screen.getByText('Shampoo'));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/client/products/[id]', params: { id: 'p-1' } });
    fireEvent.press(screen.getByText('Cabello'));
    expect(productsVm.setCategoryId).toHaveBeenCalledWith('hair');
  });

  it('permite reintentar cuando falla el catálogo', () => {
    jest.mocked(useClientProductsViewModel).mockReturnValue({ ...productsVm, products: [], error: 'Sin red' });
    const screen = render(<ClientProductsScreen />);
    expect(screen.getByText('Sin red')).toBeTruthy();
    fireEvent.press(screen.getByText('Reintentar'));
    expect(productsVm.retry).toHaveBeenCalledTimes(1);
  });

  it('muestra un error de actualización sin ocultar productos anteriores', () => {
    jest.mocked(useClientProductsViewModel).mockReturnValue({ ...productsVm, error: 'Actualización fallida' });
    const screen = render(<ClientProductsScreen />);
    expect(screen.getByText('Shampoo')).toBeTruthy();
    fireEvent.press(screen.getByText('Reintentar'));
    expect(productsVm.retry).toHaveBeenCalledTimes(1);
  });

  it('permite limpiar una búsqueda sin resultados', () => {
    jest.mocked(useClientProductsViewModel).mockReturnValue({ ...productsVm, products: [] });
    const screen = render(<ClientProductsScreen />);
    fireEvent.press(screen.getByText('Limpiar búsqueda'));
    expect(productsVm.reset).toHaveBeenCalledTimes(1);
  });

  it('respeta el estado de carga del catálogo', () => {
    jest.mocked(useClientProductsViewModel).mockReturnValue({ ...productsVm, products: [], isLoading: true });
    expect(render(<ClientProductsScreen />).getByText('Cargando productos...')).toBeTruthy();
  });

  it('agrega al carrito, compra inmediatamente y comparte el detalle', async () => {
    const screen = render(<ClientProductDetailScreen productId="p-1" />);
    expect(screen.getByText(/Nutre/)).toBeTruthy();
    fireEvent.press(screen.getByText('Agregar al carrito'));
    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Producto agregado', expect.any(String)));
    fireEvent.press(screen.getByText('Comprar ahora'));
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/client/products/cart'));
    fireEvent.press(screen.getByText('Compartir'));
    await waitFor(() => expect(Share.share).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Shampoo') })));
  });

  it('no navega si falla la adición al carrito', async () => {
    detailVm.addToCart.mockResolvedValueOnce(false);
    const screen = render(<ClientProductDetailScreen productId="p-1" />);
    fireEvent.press(screen.getByText('Comprar ahora'));
    await waitFor(() => expect(detailVm.addToCart).toHaveBeenCalledTimes(1));
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('informa cuando un producto ya no existe', () => {
    jest.mocked(useClientProductDetailViewModel).mockReturnValue({ ...detailVm, product: undefined });
    expect(render(<ClientProductDetailScreen productId="missing" />).getByText('Producto no encontrado')).toBeTruthy();
  });

  it('informa carga, fallo y agotamiento del detalle', () => {
    jest.mocked(useClientProductDetailViewModel).mockReturnValue({ ...detailVm, product: undefined, isLoading: true });
    const loading = render(<ClientProductDetailScreen productId="p-1" />);
    expect(loading.getByText('Cargando producto...')).toBeTruthy();
    loading.unmount();
    jest.mocked(useClientProductDetailViewModel).mockReturnValue({ ...detailVm, product: undefined, error: 'Sin conexión' });
    const failed = render(<ClientProductDetailScreen productId="p-1" />);
    fireEvent.press(failed.getByText('Reintentar'));
    expect(detailVm.retry).toHaveBeenCalledTimes(1);
    failed.unmount();
    jest.mocked(useClientProductDetailViewModel).mockReturnValue({ ...detailVm, product: { ...product, stock: 0 }, stock: 0, canAdd: false });
    const soldOut = render(<ClientProductDetailScreen productId="p-1" />);
    expect(soldOut.getByText('Producto agotado')).toBeTruthy();
    fireEvent.press(soldOut.getByText('Agregar al carrito'));
    expect(detailVm.addToCart).not.toHaveBeenCalled();
  });

  it('permite cambiar cantidades y quitar productos del carrito', () => {
    const screen = render(<ClientCartScreen />);
    fireEvent.press(screen.getByLabelText('Quitar Shampoo'));
    expect(cartVm.removeItem).toHaveBeenCalledWith('p-1');
    fireEvent.press(screen.getByText('Continuar al pago'));
    expect(mockRouter.push).toHaveBeenCalledWith('/client/products/checkout');
  });

  it('confirma antes de vaciar el carrito', () => {
    const screen = render(<ClientCartScreen />);
    fireEvent.press(screen.getByText('Vaciar carrito'));
    expect(Alert.alert).toHaveBeenCalledWith('Vaciar carrito', expect.any(String), expect.any(Array));
    const actions = jest.mocked(Alert.alert).mock.calls[0][2];
    actions?.[1].onPress?.();
    expect(cartVm.clearCart).toHaveBeenCalledTimes(1);
  });

  it('redirige al catálogo cuando el carrito está vacío', () => {
    jest.mocked(useClientCartViewModel).mockReturnValue({ ...cartVm, cart: { ...cart, items: [] } } as unknown as ReturnType<typeof useClientCartViewModel>);
    const screen = render(<ClientCartScreen />);
    fireEvent.press(screen.getByText('Explorar productos'));
    expect(mockRouter.replace).toHaveBeenCalledWith('/client/products');
  });

  it('indica que el carrito aún se está cargando', () => {
    jest.mocked(useClientCartViewModel).mockReturnValue({ ...cartVm, cart: { ...cart, isHydrated: false, items: [] } } as unknown as ReturnType<typeof useClientCartViewModel>);
    expect(render(<ClientCartScreen />).getByText('Cargando carrito...')).toBeTruthy();
  });

  it('muestra el formulario de transferencia y confirma una compra', async () => {
    checkoutVm.submit.mockResolvedValueOnce({ payment: { id: 'pay-1' } });
    jest.mocked(useClientProductCheckoutViewModel).mockReturnValue({ ...checkoutVm, method: 'Transferencia' } as unknown as ReturnType<typeof useClientProductCheckoutViewModel>);
    const screen = render(<ClientProductCheckoutScreen />);
    expect(screen.getByText('Banco: Banco')).toBeTruthy();
    fireEvent.press(screen.getByText('Adjuntar comprobante'));
    expect(checkoutVm.pickProof).toHaveBeenCalledTimes(1);
    fireEvent.press(screen.getByText('Confirmar pedido'));
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: '/client/profile/payments/[id]', params: { id: 'pay-1' } }));
  });

  it('no navega si el pago no se registra', async () => {
    checkoutVm.submit.mockResolvedValueOnce(null);
    const screen = render(<ClientProductCheckoutScreen />);
    fireEvent.press(screen.getByText('Confirmar pedido'));
    await waitFor(() => expect(checkoutVm.submit).toHaveBeenCalledTimes(1));
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('impide confirmar una compra vacía y ofrece volver al catálogo', () => {
    jest.mocked(useClientProductCheckoutViewModel).mockReturnValue({ ...checkoutVm, cart: { ...cart, items: [] } } as unknown as ReturnType<typeof useClientProductCheckoutViewModel>);
    const screen = render(<ClientProductCheckoutScreen />);
    fireEvent.press(screen.getByText('Volver a productos'));
    expect(mockRouter.replace).toHaveBeenCalledWith('/client/products');
    expect(screen.queryByText('Confirmar pedido')).toBeNull();
  });

  it('avisa que los datos de transferencia son de demostración', () => {
    jest.mocked(useClientProductCheckoutViewModel).mockReturnValue({
      ...checkoutVm, method: 'Transferencia', config: { bankTransfer: { ...checkoutVm.config.bankTransfer, isDemo: true } },
      canSubmit: false, submitError: 'No se puede registrar',
    } as unknown as ReturnType<typeof useClientProductCheckoutViewModel>);
    const screen = render(<ClientProductCheckoutScreen />);
    expect(screen.getByText(/datos bancarios están marcados como demostración/)).toBeTruthy();
    expect(screen.getByText('No se puede registrar')).toBeTruthy();
    fireEvent.press(screen.getByText('Confirmar pedido'));
    expect(checkoutVm.submit).not.toHaveBeenCalled();
  });
});
