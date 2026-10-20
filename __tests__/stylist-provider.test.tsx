/// <reference types="jest" />
import { act, renderHook, waitFor } from '@testing-library/react-native';

import {
  clearPublicAuthSession,
  getActivePublicAuthSession,
  getPublicAuthSession,
  subscribePublicAuthSession,
} from '../src/features/public/auth/services/public-auth-session';
import { StylistProvider, useStylist } from '../src/features/stylist/view-models/stylist-provider';
import { StylistApiError, stylistApiService } from '../src/features/stylist/services/stylist-api-service';
import {
  getNotificationsReadAt,
  saveNotificationsReadAt,
} from '../src/features/stylist/services/stylist-notification-store';

jest.mock('../src/features/public/auth/services/public-auth-session', () => ({
  clearPublicAuthSession: jest.fn(),
  getActivePublicAuthSession: jest.fn(),
  getPublicAuthSession: jest.fn(),
  subscribePublicAuthSession: jest.fn(),
}));
jest.mock('../src/features/stylist/services/stylist-api-service', () => ({
  StylistApiError: class StylistApiError extends Error {
    status?: number;
    constructor(message: string, status?: number) {
      super(message);
      this.status = status;
    }
  },
  stylistApiService: { getSnapshot: jest.fn(), updateStatus: jest.fn(), saveAvailability: jest.fn() },
}));
jest.mock('../src/features/stylist/services/stylist-notification-store', () => ({
  getNotificationsReadAt: jest.fn(),
  saveNotificationsReadAt: jest.fn(),
}));

const session = {
  token: 'test-token', user: { id: 'stylist-1', role: 'stylist' },
} as unknown as NonNullable<ReturnType<typeof getActivePublicAuthSession>>;
const appointment = {
  id: 'appointment-1', status: 'pending', updatedAt: '2026-10-20T10:00:00.000Z',
  duration: 30, durationEstimated: true,
};
const snapshot = {
  appointments: [appointment], workDays: [], blocks: [], interval: 30,
  identity: { id: 'stylist-1', name: 'Estilista' },
} as unknown as Awaited<ReturnType<typeof stylistApiService.getSnapshot>>;

let authListener: () => void;

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(getActivePublicAuthSession).mockReturnValue(null);
  jest.mocked(getPublicAuthSession).mockResolvedValue(null);
  jest.mocked(subscribePublicAuthSession).mockImplementation((listener) => {
    authListener = listener;
    return () => true;
  });
  jest.mocked(clearPublicAuthSession).mockResolvedValue(undefined);
  jest.mocked(getNotificationsReadAt).mockResolvedValue('2026-10-19T10:00:00.000Z');
  jest.mocked(saveNotificationsReadAt).mockResolvedValue(undefined);
  jest.mocked(stylistApiService.getSnapshot).mockResolvedValue(snapshot);
});

function signIn() {
  jest.mocked(getActivePublicAuthSession).mockReturnValue(session);
  jest.mocked(getPublicAuthSession).mockResolvedValue(session);
}

describe('estado compartido del estilista', () => {
  it('exige el proveedor para consumir el estado', () => {
    expect(() => renderHook(() => useStylist())).toThrow('Las pantallas de estilista deben estar dentro de StylistProvider.');
  });

  it('no consulta la API si la sesión no pertenece a un estilista', async () => {
    const { result } = renderHook(() => useStylist(), { wrapper: StylistProvider });
    await waitFor(() => expect(result.current.checkingSession).toBe(false));
    expect(result.current.hasSession).toBe(false);
    expect(result.current.hasData).toBe(false);
    expect(result.current.appointments).toEqual([]);
    expect(stylistApiService.getSnapshot).not.toHaveBeenCalled();
  });

  it('carga la sesión y calcula notificaciones recientes no leídas', async () => {
    signIn();
    const { result } = renderHook(() => useStylist(), { wrapper: StylistProvider });
    await waitFor(() => expect(result.current.hasData).toBe(true));
    expect(result.current.hasSession).toBe(true);
    expect(result.current.appointments).toHaveLength(1);
    expect(result.current.interval).toBe(30);
    expect(result.current.unreadCount).toBe(1);
    expect(result.current.notificationsRead).toBe(false);

    act(() => result.current.markNotificationsRead());
    await waitFor(() => expect(result.current.unreadCount).toBe(0));
    expect(saveNotificationsReadAt).toHaveBeenCalledWith('stylist-1', expect.any(String));
  });

  it('rechaza un cambio de estado no permitido sin enviar una mutación', async () => {
    signIn();
    const { result } = renderHook(() => useStylist(), { wrapper: StylistProvider });
    await waitFor(() => expect(result.current.hasData).toBe(true));
    await expect(result.current.updateStatus('appointment-1', 'completed')).rejects.toThrow('Esta cita ya no permite esa acción');
    expect(stylistApiService.updateStatus).not.toHaveBeenCalled();
  });

  it('actualiza la cita con la respuesta aceptada por el servidor', async () => {
    signIn();
    const updated = { ...appointment, status: 'confirmed' } as unknown as Awaited<ReturnType<typeof stylistApiService.updateStatus>>;
    jest.mocked(stylistApiService.updateStatus).mockResolvedValue(updated);
    const { result } = renderHook(() => useStylist(), { wrapper: StylistProvider });
    await waitFor(() => expect(result.current.hasData).toBe(true));
    await act(async () => result.current.updateStatus('appointment-1', 'confirmed'));
    expect(stylistApiService.updateStatus).toHaveBeenCalledWith('appointment-1', 'confirmed', 30);
    expect(result.current.appointments[0].status).toBe('confirmed');
    expect(result.current.busy).toBe(false);
  });

  it('guarda disponibilidad y ajusta duraciones estimadas', async () => {
    signIn();
    const saved = { workDays: [], blocks: [], interval: 45 };
    jest.mocked(stylistApiService.saveAvailability).mockResolvedValue(saved);
    const { result } = renderHook(() => useStylist(), { wrapper: StylistProvider });
    await waitFor(() => expect(result.current.hasData).toBe(true));
    await act(async () => result.current.saveAvailability([], [], 45));
    expect(stylistApiService.saveAvailability).toHaveBeenCalledWith([], [], 45);
    expect(result.current.interval).toBe(45);
    expect(result.current.appointments[0].duration).toBe(45);
  });

  it('invalida una sesión rechazada por la API al refrescar', async () => {
    signIn();
    jest.mocked(stylistApiService.getSnapshot).mockRejectedValue(new StylistApiError('Sin autorización', 401));
    const { result } = renderHook(() => useStylist(), { wrapper: StylistProvider });
    await waitFor(() => expect(result.current.error).toBe('Sin autorización'));
    expect(clearPublicAuthSession).toHaveBeenCalledTimes(1);
    expect(result.current.refreshing).toBe(false);
  });

  it('descarta datos de una cuenta anterior al cambiar la sesión', async () => {
    signIn();
    const { result } = renderHook(() => useStylist(), { wrapper: StylistProvider });
    await waitFor(() => expect(result.current.hasData).toBe(true));
    jest.mocked(getActivePublicAuthSession).mockReturnValue(null);
    act(() => authListener());
    expect(result.current.hasSession).toBe(false);
    expect(result.current.appointments).toEqual([]);
  });
});
