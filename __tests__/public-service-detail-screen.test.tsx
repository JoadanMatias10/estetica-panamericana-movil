/// <reference types="jest" />
import { fireEvent, render } from '@testing-library/react-native';

import type { PublicServiceDetail } from '../src/features/public/models/public-service';
import { ServiceDetailScreen, type ServiceDetailScreenProps } from '../src/features/public/views/service-detail-screen';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

const service: PublicServiceDetail = {
  id: 's-1', name: 'Corte', category: 'Cabello', subcategory: 'Corte',
  description: 'Corte profesional', durationText: '30 min', priceFrom: 250,
  gallery: [{ uri: 'https://example.test/one.png' }, { uri: 'https://example.test/two.png' }],
};
const actions = {
  onBack: jest.fn(), onLogin: jest.fn(), onRetry: jest.fn(), onSelectImage: jest.fn(),
  onShare: jest.fn(), onViewServices: jest.fn(),
};

function show(value: Partial<ServiceDetailScreenProps>) {
  return render(<ServiceDetailScreen {...actions} status="ready" service={service} {...value} />);
}

beforeEach(() => jest.clearAllMocks());

describe('detalle público de servicio', () => {
  it('distingue carga, error y servicio ausente', () => {
    const loading = show({ status: 'loading' });
    expect(loading.getByText('Cargando servicio…')).toBeTruthy();
    loading.unmount();
    const failed = show({ status: 'error', errorMessage: 'Sin red' });
    expect(failed.getByText('Sin red')).toBeTruthy();
    fireEvent.press(failed.getByText('Reintentar'));
    expect(actions.onRetry).toHaveBeenCalledTimes(1);
    failed.unmount();
    const missing = show({ status: 'not-found', service: undefined });
    fireEvent.press(missing.getByText('Ver todos los servicios'));
    expect(actions.onViewServices).toHaveBeenCalledTimes(1);
  });

  it('muestra información, cambia la imagen y comparte el servicio', () => {
    const screen = show({ selectedImageIndex: 0 });
    expect(screen.getByText('Corte profesional')).toBeTruthy();
    expect(screen.getByText('30 min')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Mostrar imagen 2 de 2'));
    expect(actions.onSelectImage).toHaveBeenCalledWith(1);
    fireEvent.press(screen.getByLabelText('Compartir servicio'));
    expect(actions.onShare).toHaveBeenCalledTimes(1);
    fireEvent.press(screen.getByLabelText('Iniciar sesión para agendar Corte'));
    expect(actions.onLogin).toHaveBeenCalledTimes(1);
  });

  it('desactiva compartir mientras se abre la opción del sistema', () => {
    const screen = show({ isSharing: true });
    fireEvent.press(screen.getByLabelText('Compartir servicio'));
    expect(actions.onShare).not.toHaveBeenCalled();
  });

  it('informa el error al compartir y permite volver al catálogo', () => {
    const screen = show({ shareError: 'No se pudo compartir' });
    expect(screen.getByText('No se pudo compartir')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Volver al catálogo de servicios'));
    expect(actions.onBack).toHaveBeenCalledTimes(1);
  });

  it('ofrece iniciar sesión aun si no hay imagen ni precio', () => {
    const screen = show({ service: { id: 's-2', name: 'Peinado' } });
    expect(screen.getByText('Peinado')).toBeTruthy();
    expect(screen.queryByText('Precio inicial del servicio')).toBeNull();
    fireEvent.press(screen.getByLabelText('Iniciar sesión para agendar Peinado'));
    expect(actions.onLogin).toHaveBeenCalledTimes(1);
  });
});
