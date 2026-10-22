/// <reference types="jest" />
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Alert, Share } from 'react-native';

import {
  ClientServiceDetailScreen,
  ClientServicePaymentScreen,
  ClientServicesScreen,
} from '../src/features/client/views/client-services-screens';
import { useClientServiceDetailViewModel } from '../src/features/client/view-models/use-client-service-detail-view-model';
import { useClientServicePaymentViewModel } from '../src/features/client/view-models/use-client-service-payment-view-model';
import { useClientServicesViewModel } from '../src/features/client/view-models/use-client-services-view-model';
import type { PublicService } from '../src/features/public/models/public-service';

const mockRouter = { push: jest.fn(), replace: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('../src/features/client/view-models/use-client-service-detail-view-model', () => ({ useClientServiceDetailViewModel: jest.fn() }));
jest.mock('../src/features/client/view-models/use-client-service-payment-view-model', () => ({ useClientServicePaymentViewModel: jest.fn() }));
jest.mock('../src/features/client/view-models/use-client-services-view-model', () => ({ useClientServicesViewModel: jest.fn() }));
jest.mock('../src/features/client/components/client-page-header', () => ({
  ClientPageHeader: ({ title }: { title: string }) => {
    const { Text } = require('react-native');
    return <Text>{title}</Text>;
  },
}));
jest.mock('../src/features/client/components/client-service-card', () => ({
  ClientServiceCard: ({ onDetail, onSchedule, service }: {
    onDetail: (service: PublicService) => void;
    onSchedule: (service: PublicService) => void;
    service: PublicService;
  }) => {
    const { Pressable, Text, View } = require('react-native');
    return <View><Pressable onPress={() => onDetail(service)}><Text>{service.name}</Text></Pressable><Pressable onPress={() => onSchedule(service)}><Text>Agendar {service.name}</Text></Pressable></View>;
  },
}));
jest.mock('../src/shared/components/app-screen', () => ({
  AppScreen: ({ children }: { children: React.ReactNode }) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
}));

const service: PublicService = {
  id: 's-1', name: 'Corte', categoryId: 'hair', segment: 'Cabello', subcategory: 'Corte',
  description: 'Corte profesional', priceFrom: 250, durationLabel: '30 min',
  images: [], featured: false,
};
const servicesVm = {
  services: [service], categories: [{ id: 'all', label: 'Todos' }, { id: 'hair', label: 'Cabello' }],
  categoryId: 'all', query: '', isLoading: false, isRefreshing: false, error: '',
  setCategoryId: jest.fn(), setQuery: jest.fn(), refresh: jest.fn(), retry: jest.fn(), reset: jest.fn(),
};
const detailVm = {
  service: { ...service, durationText: '30 min' }, isLoading: false, error: '', retry: jest.fn(),
};
const appointment = {
  id: 'a-1', serviceId: 's-1', serviceName: 'Corte', servicePrice: 250,
  dateTime: '2026-10-20T10:00:00.000Z',
};
const paymentVm = {
  appointments: [appointment], selectedAppointment: appointment, selectedAppointmentId: 'a-1',
  method: 'Pago en sucursal', config: { bankTransfer: { bank: 'Banco', beneficiary: 'Persona', clabe: '123', isDemo: false } },
  reference: '', notes: '', proof: undefined, isLoading: false, isPickingProof: false,
  isSubmitting: false, canSubmit: true, error: '', submitError: '',
  retry: jest.fn(), setSelectedAppointmentId: jest.fn(), selectMethod: jest.fn(),
  setReference: jest.fn(), setNotes: jest.fn(), pickProof: jest.fn(), removeProof: jest.fn(), submit: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useClientServicesViewModel).mockReturnValue(servicesVm);
  jest.mocked(useClientServiceDetailViewModel).mockReturnValue(detailVm);
  jest.mocked(useClientServicePaymentViewModel).mockReturnValue(paymentVm as unknown as ReturnType<typeof useClientServicePaymentViewModel>);
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction });
});
afterEach(() => jest.restoreAllMocks());

describe('pantallas de servicios y pagos del cliente', () => {
  it('abre el detalle y la agenda desde el catálogo', () => {
    const screen = render(<ClientServicesScreen />);
    fireEvent.press(screen.getByText('Corte'));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/client/services/[id]', params: { id: 's-1' } });
    fireEvent.press(screen.getByText('Agendar Corte'));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/client/appointments/schedule', params: { serviceId: 's-1' } });
  });

  it('muestra un error de catálogo y permite reintentar', () => {
    jest.mocked(useClientServicesViewModel).mockReturnValue({ ...servicesVm, services: [], error: 'Sin red' });
    const screen = render(<ClientServicesScreen />);
    expect(screen.getByText('Sin red')).toBeTruthy();
    fireEvent.press(screen.getByText('Reintentar'));
    expect(servicesVm.retry).toHaveBeenCalledTimes(1);
  });

  it('conserva los servicios cargados ante un error de actualización', () => {
    jest.mocked(useClientServicesViewModel).mockReturnValue({ ...servicesVm, error: 'Actualización fallida' });
    const screen = render(<ClientServicesScreen />);
    expect(screen.getByText('Corte')).toBeTruthy();
    fireEvent.press(screen.getByText('Reintentar'));
    expect(servicesVm.retry).toHaveBeenCalledTimes(1);
  });

  it('limpia filtros cuando no encuentra servicios', () => {
    jest.mocked(useClientServicesViewModel).mockReturnValue({ ...servicesVm, services: [] });
    fireEvent.press(render(<ClientServicesScreen />).getByText('Limpiar búsqueda'));
    expect(servicesVm.reset).toHaveBeenCalledTimes(1);
  });

  it('distingue carga del catálogo de ausencia de resultados', () => {
    jest.mocked(useClientServicesViewModel).mockReturnValue({ ...servicesVm, services: [], isLoading: true });
    expect(render(<ClientServicesScreen />).getByText('Cargando servicios...')).toBeTruthy();
  });

  it('agenda, consulta disponibilidad y comparte un servicio', async () => {
    const screen = render(<ClientServiceDetailScreen serviceId="s-1" />);
    fireEvent.press(screen.getByText('Agendar este servicio'));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/client/appointments/schedule', params: { serviceId: 's-1' } });
    fireEvent.press(screen.getByText('Consultar disponibilidad'));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/client/appointments/availability', params: { serviceId: 's-1' } });
    fireEvent.press(screen.getByText('Compartir'));
    await waitFor(() => expect(Share.share).toHaveBeenCalledWith({ message: 'Corte\nCorte profesional' }));
  });

  it('informa cuando el servicio solicitado ya no está disponible', () => {
    jest.mocked(useClientServiceDetailViewModel).mockReturnValue({ ...detailVm, service: undefined });
    expect(render(<ClientServiceDetailScreen serviceId="missing" />).getByText('Servicio no encontrado')).toBeTruthy();
  });

  it('distingue carga y error del detalle del servicio', () => {
    jest.mocked(useClientServiceDetailViewModel).mockReturnValue({ ...detailVm, service: undefined, isLoading: true });
    const loading = render(<ClientServiceDetailScreen serviceId="s-1" />);
    expect(loading.getByText('Cargando servicio...')).toBeTruthy();
    loading.unmount();
    jest.mocked(useClientServiceDetailViewModel).mockReturnValue({ ...detailVm, service: undefined, error: 'Sin conexión' });
    const failed = render(<ClientServiceDetailScreen serviceId="s-1" />);
    fireEvent.press(failed.getByText('Reintentar'));
    expect(detailVm.retry).toHaveBeenCalledTimes(1);
  });

  it('permite seleccionar una cita y registra el pago de servicio', async () => {
    paymentVm.submit.mockResolvedValueOnce({ payment: { id: 'pay-1' }, message: 'En proceso' });
    const screen = render(<ClientServicePaymentScreen serviceId="s-1" />);
    fireEvent.press(screen.getByText('Corte'));
    expect(paymentVm.setSelectedAppointmentId).toHaveBeenCalledWith('a-1');
    fireEvent.press(screen.getByText(/Registrar/));
    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Pago registrado', 'En proceso', expect.any(Array)));
    const actions = jest.mocked(Alert.alert).mock.calls[0][2];
    actions?.[0].onPress?.();
    expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: '/client/profile/payments/[id]', params: { id: 'pay-1' } });
  });

  it('muestra datos bancarios y permite adjuntar comprobante', () => {
    jest.mocked(useClientServicePaymentViewModel).mockReturnValue({ ...paymentVm, method: 'Transferencia' } as unknown as ReturnType<typeof useClientServicePaymentViewModel>);
    const screen = render(<ClientServicePaymentScreen />);
    expect(screen.getByText('Banco: Banco')).toBeTruthy();
    fireEvent.press(screen.getByText('Seleccionar comprobante'));
    expect(paymentVm.pickProof).toHaveBeenCalledTimes(1);
  });

  it('advierte si los datos bancarios son de demostración', () => {
    jest.mocked(useClientServicePaymentViewModel).mockReturnValue({
      ...paymentVm, method: 'Transferencia',
      config: { bankTransfer: { ...paymentVm.config.bankTransfer, isDemo: true } },
      canSubmit: false, submitError: 'Pago no permitido',
    } as unknown as ReturnType<typeof useClientServicePaymentViewModel>);
    const screen = render(<ClientServicePaymentScreen />);
    expect(screen.getByText(/cuenta está marcada como demostración/)).toBeTruthy();
    expect(screen.getByText('Pago no permitido')).toBeTruthy();
    fireEvent.press(screen.getByText(/Registrar/));
    expect(paymentVm.submit).not.toHaveBeenCalled();
  });

  it('redirige a las citas cuando no hay pagos posibles', () => {
    jest.mocked(useClientServicePaymentViewModel).mockReturnValue({ ...paymentVm, appointments: [] } as unknown as ReturnType<typeof useClientServicePaymentViewModel>);
    fireEvent.press(render(<ClientServicePaymentScreen />).getByText('Ver mis citas'));
    expect(mockRouter.replace).toHaveBeenCalledWith('/client/appointments');
  });

  it('permite reintentar si falla la preparación del pago', () => {
    jest.mocked(useClientServicePaymentViewModel).mockReturnValue({ ...paymentVm, error: 'Sin conexión' } as unknown as ReturnType<typeof useClientServicePaymentViewModel>);
    const screen = render(<ClientServicePaymentScreen />);
    fireEvent.press(screen.getByText('Reintentar'));
    expect(paymentVm.retry).toHaveBeenCalledTimes(1);
  });

  it('no muestra confirmación cuando el servidor rechaza el pago', async () => {
    paymentVm.submit.mockResolvedValueOnce(null);
    fireEvent.press(render(<ClientServicePaymentScreen />).getByText(/Registrar/));
    await waitFor(() => expect(paymentVm.submit).toHaveBeenCalledTimes(1));
    expect(Alert.alert).not.toHaveBeenCalled();
  });
});
