/// <reference types="jest" />
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { Share } from 'react-native';

import type { PublicService } from '../src/features/public/models/public-service';
import { getService } from '../src/features/public/services/public-api-service';
import { usePublicApiResource } from '../src/features/public/view-models/use-public-api-resource';
import { useServiceDetailViewModel } from '../src/features/public/view-models/use-service-detail-view-model';

jest.mock('../src/features/public/services/public-api-service', () => ({ getService: jest.fn() }));

const service: PublicService = {
  id: 's-1', name: 'Corte', categoryId: 'hair', segment: 'Cabello', subcategory: 'Corte',
  description: 'Corte profesional', priceFrom: 250, durationLabel: '30 min',
  images: [{ uri: 'https://example.test/one.png' }, { uri: 'https://example.test/two.png' }],
  image: { uri: 'https://example.test/one.png' }, featured: false,
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(getService).mockResolvedValue(service);
  jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction });
});
afterEach(() => jest.restoreAllMocks());

describe('recurso remoto público', () => {
  it('carga datos y actualiza con forceRefresh', async () => {
    const loader = jest.fn(async () => 'primero');
    const { result } = renderHook(() => usePublicApiResource(loader));
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.data).toBe('primero'));
    expect(loader).toHaveBeenCalledWith({ forceRefresh: false });
    loader.mockResolvedValueOnce('actualizado');
    act(() => result.current.onRefresh());
    await waitFor(() => expect(result.current.data).toBe('actualizado'));
    expect(loader).toHaveBeenLastCalledWith({ forceRefresh: true });
    expect(result.current.isRefreshing).toBe(false);
  });

  it('conserva datos previos y muestra un fallo de actualización', async () => {
    const loader = jest.fn(async () => 'dato válido');
    const { result } = renderHook(() => usePublicApiResource(loader));
    await waitFor(() => expect(result.current.data).toBe('dato válido'));
    loader.mockRejectedValueOnce(new Error('Sin conexión'));
    act(() => result.current.onRefresh());
    await waitFor(() => expect(result.current.error).toBe('Sin conexión'));
    expect(result.current.data).toBe('dato válido');
    act(() => result.current.onRetry());
    await waitFor(() => expect(result.current.error).toBeUndefined());
    expect(loader).toHaveBeenLastCalledWith({ forceRefresh: true });
  });

  it('muestra un error genérico si el servidor rechaza sin mensaje', async () => {
    const loader = jest.fn().mockRejectedValue(new Error('   '));
    const { result } = renderHook(() => usePublicApiResource<string>(loader));
    await waitFor(() => expect(result.current.error).toContain('No fue posible cargar'));
  });

  it('descarta una respuesta obsoleta después de una petición más reciente', async () => {
    let resolveOld: (value: string) => void = () => {};
    const loader = jest.fn()
      .mockImplementationOnce(() => new Promise<string>((resolve) => { resolveOld = resolve; }))
      .mockResolvedValueOnce('nuevo');
    const { result } = renderHook(() => usePublicApiResource<string>(loader));
    await waitFor(() => expect(loader).toHaveBeenCalledTimes(1));
    act(() => result.current.onRefresh());
    await waitFor(() => expect(result.current.data).toBe('nuevo'));
    await act(async () => resolveOld('obsoleto'));
    expect(result.current.data).toBe('nuevo');
  });
});

describe('detalle público de servicio', () => {
  it('presenta el servicio cargado, imágenes y precio del servidor', async () => {
    const { result } = renderHook(() => useServiceDetailViewModel('s-1'));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.service).toMatchObject({
      name: 'Corte', category: 'Corte', durationText: '30 min', priceFrom: 250,
      gallery: service.images,
    });
    act(() => result.current.onSelectImage(1));
    expect(result.current.selectedImageIndex).toBe(1);
  });

  it('distingue servicio inexistente de error de red', async () => {
    jest.mocked(getService).mockResolvedValueOnce(undefined);
    const missing = renderHook(() => useServiceDetailViewModel('missing'));
    await waitFor(() => expect(missing.result.current.status).toBe('not-found'));
    missing.unmount();
    jest.mocked(getService).mockRejectedValueOnce(new Error('Servidor sin conexión'));
    const failed = renderHook(() => useServiceDetailViewModel('s-1'));
    await waitFor(() => expect(failed.result.current.status).toBe('error'));
    expect(failed.result.current.errorMessage).toBe('Servidor sin conexión');
  });

  it('comparte un resumen del servicio y comunica fallos de la plataforma', async () => {
    const { result } = renderHook(() => useServiceDetailViewModel('s-1'));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    act(() => result.current.onShare());
    await waitFor(() => expect(Share.share).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Corte', message: expect.stringContaining('30 min'),
    })));
    jest.mocked(Share.share).mockRejectedValueOnce(new Error('Sin aplicación'));
    act(() => result.current.onShare());
    await waitFor(() => expect(result.current.shareError).toContain('No se pudieron abrir'));
    expect(result.current.isSharing).toBe(false);
  });
});
