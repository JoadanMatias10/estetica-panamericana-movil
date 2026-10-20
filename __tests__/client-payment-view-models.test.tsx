/// <reference types="jest" />
import { act, renderHook, waitFor } from '@testing-library/react-native';

import type { ClientAppointment } from '../src/features/client/models/client-appointment';
import type { ClientPaymentConfig, ClientPaymentProof } from '../src/features/client/models/client-payment';
import { clientApiService } from '../src/features/client/services/client-api-service';
import { clientCartStore } from '../src/features/client/services/client-cart-store';
import { pickClientPaymentProof } from '../src/features/client/services/client-payment-proof-picker';
import { useClientCartViewModel } from '../src/features/client/view-models/use-client-cart-view-model';
import { useClientProductCheckoutViewModel } from '../src/features/client/view-models/use-client-product-checkout-view-model';
import { useClientServicePaymentViewModel } from '../src/features/client/view-models/use-client-service-payment-view-model';

jest.mock('../src/features/client/services/client-api-service', () => ({
  clientApiService: { getAppointments: jest.fn(), getPaymentConfig: jest.fn(), createPayment: jest.fn() },
}));
jest.mock('../src/features/client/services/client-cart-store', () => ({ clientCartStore: { clear: jest.fn() } }));
jest.mock('../src/features/client/services/client-payment-proof-picker', () => ({ pickClientPaymentProof: jest.fn() }));
jest.mock('../src/features/client/view-models/use-client-cart-view-model', () => ({ useClientCartViewModel: jest.fn() }));

const appointment: ClientAppointment = {
  id: 'a-1', serviceId: 's-1', serviceName: 'Corte', servicePrice: 250,
  status: 'confirmada', paymentStatus: 'Sin pago', dateTime: '2030-01-01T12:00:00.000Z',
  createdAt: '2026-10-01T12:00:00.000Z', updatedAt: '2026-10-01T12:00:00.000Z',
  durationMinutes: 30, notes: '', paidAt: null, paymentId: '', stylistId: 'stylist-1',
};
const config: ClientPaymentConfig = {
  bankTransfer: { account: '123', bank: 'Banco', beneficiary: 'Persona', clabe: '123456', isDemo: false, message: '' },
};
const proof: ClientPaymentProof = { mimeType: 'image/jpeg', name: 'comprobante.jpg', uri: 'file:///comprobante.jpg' };
const cart = {
  distinctItemCount: 1, isHydrated: true,
  items: [{ productId: 'p-1', name: 'Shampoo', presentation: '250 ml', stock: 4, unitPrice: 120, quantity: 2 }],
  subtotal: 240, totalQuantity: 2,
};
const cartViewModel = {
  cart, addItem: jest.fn(), clearCart: jest.fn(), removeItem: jest.fn(), updateQuantity: jest.fn(),
};
const paymentResult = { payment: { id: 'pay-1' }, message: 'Registrado' } as unknown as Awaited<ReturnType<typeof clientApiService.createPayment>>;

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(clientApiService.getAppointments).mockResolvedValue([appointment]);
  jest.mocked(clientApiService.getPaymentConfig).mockResolvedValue(config);
  jest.mocked(clientApiService.createPayment).mockResolvedValue(paymentResult);
  jest.mocked(pickClientPaymentProof).mockResolvedValue(proof);
  jest.mocked(clientCartStore.clear).mockResolvedValue({ ...cart, items: [], totalQuantity: 0, subtotal: 0, distinctItemCount: 0 });
  jest.mocked(useClientCartViewModel).mockReturnValue(cartViewModel);
});

describe('pago de servicio', () => {
  it('impide pagar si ninguna cita activa coincide con el servicio', async () => {
    const { result } = renderHook(() => useClientServicePaymentViewModel({ serviceId: 'otro-servicio' }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.appointments).toEqual([]);
    expect(result.current.canSubmit).toBe(false);
    await act(async () => expect(await result.current.submit()).toBeNull());
    expect(result.current.submitError).toContain('Selecciona una cita válida');
    expect(clientApiService.createPayment).not.toHaveBeenCalled();
  });

  it('filtra citas pagables, respeta la selección y envía los datos al servidor', async () => {
    jest.mocked(clientApiService.getAppointments).mockResolvedValue([
      appointment, { ...appointment, id: 'a-2', status: 'cancelada' },
    ]);
    const { result } = renderHook(() => useClientServicePaymentViewModel({ appointmentId: 'a-1', serviceId: 's-1' }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.appointments.map((item) => item.id)).toEqual(['a-1']);
    expect(result.current.selectedAppointmentId).toBe('a-1');
    expect(result.current.canSubmit).toBe(true);
    act(() => result.current.setNotes('Llegaré temprano'));
    await act(async () => expect(await result.current.submit()).toEqual(paymentResult));
    expect(clientApiService.createPayment).toHaveBeenCalledWith({
      appointmentId: 'a-1', items: [{ itemId: 's-1', quantity: 1 }], method: 'Pago en sucursal',
      notes: 'Llegaré temprano', reference: '', type: 'Servicio',
    }, undefined);
  });

  it('rechaza una transferencia de demostración', async () => {
    jest.mocked(clientApiService.getPaymentConfig).mockResolvedValue({ bankTransfer: { ...config.bankTransfer, isDemo: true } });
    const { result } = renderHook(() => useClientServicePaymentViewModel());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.selectMethod('Transferencia'));
    await act(async () => expect(await result.current.submit()).toBeNull());
    expect(result.current.submitError).toContain('demostración');
    expect(clientApiService.createPayment).not.toHaveBeenCalled();
  });

  it('exige referencia y comprobante para transferir', async () => {
    const { result } = renderHook(() => useClientServicePaymentViewModel());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.selectMethod('Transferencia'));
    await act(async () => expect(await result.current.submit()).toBeNull());
    expect(result.current.submitError).toContain('comprobante');
    act(() => result.current.setReference('1234'));
    await act(async () => result.current.pickProof());
    expect(result.current.canSubmit).toBeTruthy();
    await act(async () => expect(await result.current.submit()).toEqual(paymentResult));
    expect(clientApiService.createPayment).toHaveBeenCalledWith(expect.objectContaining({
      method: 'Transferencia', reference: '1234', type: 'Servicio',
    }), proof);
    act(() => result.current.selectMethod('Pago en sucursal'));
    expect(result.current.proof).toBeUndefined();
    expect(result.current.reference).toBe('');
  });

  it('informa fallos de carga, selección de archivo y registro del pago', async () => {
    jest.mocked(clientApiService.getAppointments).mockRejectedValueOnce(new Error('Sin conexión'));
    const { result } = renderHook(() => useClientServicePaymentViewModel());
    await waitFor(() => expect(result.current.error).toBe('Sin conexión'));
    await act(async () => result.current.retry());
    expect(result.current.appointments).toHaveLength(1);
    jest.mocked(pickClientPaymentProof).mockRejectedValueOnce(new Error('Galería cerrada'));
    await act(async () => result.current.pickProof());
    expect(result.current.submitError).toBe('Galería cerrada');
    jest.mocked(clientApiService.createPayment).mockRejectedValueOnce(new Error('Servidor rechazó el pago'));
    await act(async () => expect(await result.current.submit()).toBeNull());
    expect(result.current.submitError).toBe('Servidor rechazó el pago');
    expect(result.current.isSubmitting).toBe(false);
  });
});

describe('compra de productos', () => {
  it('permite reintentar al fallar la configuración de pago', async () => {
    jest.mocked(clientApiService.getPaymentConfig).mockRejectedValueOnce(new Error('Sin configuración'));
    const { result } = renderHook(() => useClientProductCheckoutViewModel());
    await waitFor(() => expect(result.current.error).toBe('Sin configuración'));
    await act(async () => result.current.retry());
    expect(result.current.error).toBe('');
    expect(result.current.config).toEqual(config);
  });

  it('crea el pedido y vacía el carrito sólo después del éxito', async () => {
    const { result } = renderHook(() => useClientProductCheckoutViewModel());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.canSubmit).toBe(true);
    await act(async () => expect(await result.current.submit()).toEqual(paymentResult));
    expect(clientApiService.createPayment).toHaveBeenCalledWith({
      items: [{ itemId: 'p-1', quantity: 2 }], method: 'Pago en sucursal',
      notes: '', reference: '', type: 'Producto',
    }, undefined);
    expect(clientCartStore.clear).toHaveBeenCalledTimes(1);
  });

  it('bloquea una transferencia de demostración y una sin comprobante', async () => {
    jest.mocked(clientApiService.getPaymentConfig).mockResolvedValue({ bankTransfer: { ...config.bankTransfer, isDemo: true } });
    const { result } = renderHook(() => useClientProductCheckoutViewModel());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.selectMethod('Transferencia'));
    await act(async () => expect(await result.current.submit()).toBeNull());
    expect(result.current.submitError).toContain('demostración');
    expect(clientApiService.createPayment).not.toHaveBeenCalled();
  });

  it('rechaza transferencias incompletas aun con datos bancarios reales', async () => {
    const { result } = renderHook(() => useClientProductCheckoutViewModel());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.selectMethod('Transferencia'));
    await act(async () => expect(await result.current.submit()).toBeNull());
    expect(result.current.submitError).toContain('referencia y adjunta');
    expect(clientApiService.createPayment).not.toHaveBeenCalled();
  });

  it('adjunta el comprobante real y permite retirarlo', async () => {
    const { result } = renderHook(() => useClientProductCheckoutViewModel());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => { result.current.selectMethod('Transferencia'); result.current.setReference('1234'); });
    await act(async () => result.current.pickProof());
    expect(result.current.proof).toEqual(proof);
    expect(result.current.canSubmit).toBeTruthy();
    await act(async () => expect(await result.current.submit()).toEqual(paymentResult));
    expect(clientApiService.createPayment).toHaveBeenCalledWith(expect.objectContaining({ method: 'Transferencia' }), proof);
    act(() => result.current.removeProof());
    expect(result.current.canSubmit).toBeFalsy();
  });

  it('informa si falla la galería y limpia transferencia al volver a pago en sucursal', async () => {
    jest.mocked(pickClientPaymentProof).mockRejectedValueOnce(new Error('Permiso denegado'));
    const { result } = renderHook(() => useClientProductCheckoutViewModel());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.selectMethod('Transferencia'));
    await act(async () => result.current.pickProof());
    expect(result.current.submitError).toBe('Permiso denegado');
    act(() => result.current.setReference('1234'));
    act(() => result.current.selectMethod('Pago en sucursal'));
    expect(result.current.reference).toBe('');
    expect(result.current.proof).toBeUndefined();
  });

  it('conserva el carrito si el servidor rechaza el pedido', async () => {
    jest.mocked(clientApiService.createPayment).mockRejectedValueOnce(new Error('Pago rechazado'));
    const { result } = renderHook(() => useClientProductCheckoutViewModel());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => expect(await result.current.submit()).toBeNull());
    expect(result.current.submitError).toBe('Pago rechazado');
    expect(clientCartStore.clear).not.toHaveBeenCalled();
  });

  it('no crea pedidos si el carrito está vacío', async () => {
    jest.mocked(useClientCartViewModel).mockReturnValue({ ...cartViewModel, cart: { ...cart, items: [] } });
    const { result } = renderHook(() => useClientProductCheckoutViewModel());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => expect(await result.current.submit()).toBeNull());
    expect(clientApiService.createPayment).not.toHaveBeenCalled();
  });
});
