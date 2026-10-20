/// <reference types="jest" />
import { fireEvent, render } from '@testing-library/react-native';

import { ClientServiceCard } from '../src/features/client/components/client-service-card';
import { CatalogStatus } from '../src/features/public/components/catalog-status';
import { ProductImage } from '../src/features/public/components/product-image';
import type { PublicService } from '../src/features/public/models/public-service';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('expo-image', () => ({
  Image: ({ accessibilityLabel, onError }: { accessibilityLabel: string; onError: () => void }) => {
    const { View } = require('react-native');
    return <View accessibilityLabel={accessibilityLabel} onError={onError} />;
  },
}));

const service: PublicService = {
  id: 's-1', name: 'Corte', categoryId: 'hair', segment: 'Cabello', subcategory: 'Corte',
  description: 'Corte profesional', priceFrom: 250, durationLabel: '30 min',
  image: { uri: 'https://example.test/corte.png' }, images: [], featured: false,
};

describe('componentes de catálogo', () => {
  it('muestra carga, error y acción de reintento', () => {
    const onAction = jest.fn();
    const loading = render(<CatalogStatus kind="loading" title="Cargando" />);
    expect(loading.getByLabelText('Cargando')).toBeTruthy();
    loading.unmount();
    const failed = render(<CatalogStatus kind="error" title="Error" message="Sin red" actionLabel="Reintentar" onAction={onAction} />);
    expect(failed.getByText('Sin red')).toBeTruthy();
    fireEvent.press(failed.getByText('Reintentar'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('usa un indicador cuando la imagen de producto falta o falla', () => {
    const missing = render(<ProductImage label="Shampoo" style={{ width: 100 }} />);
    expect(missing.getByLabelText('Imagen pendiente')).toBeTruthy();
    missing.unmount();
    const loaded = render(<ProductImage label="Shampoo" source={{ uri: 'https://example.test/shampoo.png' }} style={{ width: 100 }} />);
    fireEvent(loaded.getByLabelText('Shampoo'), 'onError');
    expect(loaded.getByLabelText('Imagen pendiente')).toBeTruthy();
  });

  it('abre el detalle o la agenda desde la tarjeta de servicio', () => {
    const onDetail = jest.fn();
    const onSchedule = jest.fn();
    const screen = render(<ClientServiceCard category="Cabello" onDetail={onDetail} onSchedule={onSchedule} service={service} />);
    expect(screen.getByText('Corte profesional')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Ver detalle de Corte'));
    fireEvent.press(screen.getByLabelText('Agendar Corte'));
    expect(onDetail).toHaveBeenCalledWith(service);
    expect(onSchedule).toHaveBeenCalledWith(service);
  });

  it('conserva las acciones si falla la imagen del servicio', () => {
    const onDetail = jest.fn();
    const screen = render(<ClientServiceCard category="Cabello" onDetail={onDetail} onSchedule={jest.fn()} service={service} />);
    fireEvent(screen.getByLabelText('Imagen de Corte'), 'onError');
    expect(screen.queryByLabelText('Imagen de Corte')).toBeNull();
    fireEvent.press(screen.getByLabelText('Ver detalle de Corte'));
    expect(onDetail).toHaveBeenCalledWith(service);
  });
});
