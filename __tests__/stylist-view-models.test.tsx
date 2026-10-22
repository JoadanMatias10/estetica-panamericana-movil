/// <reference types="jest" />
import { act, renderHook } from '@testing-library/react-native';
import * as Linking from 'expo-linking';

import { dateKey, type StylistAppointment, type WorkDay } from '../src/features/stylist/models/stylist';
import { useStylist } from '../src/features/stylist/view-models/stylist-provider';
import { useStylistAgendaViewModel } from '../src/features/stylist/view-models/use-stylist-agenda-view-model';
import { useStylistAppointmentDetailViewModel } from '../src/features/stylist/view-models/use-stylist-appointment-detail-view-model';
import { useStylistAppointmentsViewModel } from '../src/features/stylist/view-models/use-stylist-appointments-view-model';
import { useStylistHomeViewModel } from '../src/features/stylist/view-models/use-stylist-home-view-model';
import { useStylistNotificationsViewModel } from '../src/features/stylist/view-models/use-stylist-notifications-view-model';
import { useStylistScheduleViewModel } from '../src/features/stylist/view-models/use-stylist-schedule-view-model';
import { useStylistServicesViewModel } from '../src/features/stylist/view-models/use-stylist-services-view-model';

jest.mock('../src/features/stylist/view-models/stylist-provider', () => ({ useStylist: jest.fn() }));
jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({ id: 'a-1' }) }));
jest.mock('expo-linking', () => ({ openURL: jest.fn() }));

const now = new Date('2026-10-20T12:00:00');
const today = dateKey(now);
const appointment: StylistAppointment = {
  id: 'a-1', client: 'Ana López', service: 'Corte', phone: '+52 55 1234 5678', email: 'ana@example.test',
  date: today, start: '13:00', duration: 30, durationEstimated: true, status: 'pending', assigned: true,
  notes: '', updatedAt: new Date('2026-10-20T11:30:00').toISOString(),
};
const completed: StylistAppointment = {
  ...appointment, id: 'a-2', client: 'Bea', status: 'completed', start: '10:00',
};
const days: WorkDay[] = Array.from({ length: 7 }, (_, weekday) => ({
  weekday, label: `Día ${weekday}`, active: true, start: '09:00', end: '18:00', breakStart: '', breakEnd: '',
}));
const stylist = {
  appointments: [appointment, completed], workDays: days, blocks: [], interval: 30,
  identity: { id: 'stylist-1', name: 'Estilista' }, hasData: true, checkingSession: false, hasSession: true,
  refreshing: false, busy: false, error: '', lastUpdated: now.toISOString(), notificationsRead: false,
  unreadCount: 1, readAt: '', refresh: jest.fn(), updateStatus: jest.fn(), saveAvailability: jest.fn(),
  markNotificationsRead: jest.fn(), signOut: jest.fn(),
} as unknown as ReturnType<typeof useStylist>;

beforeEach(() => {
  jest.useFakeTimers().setSystemTime(now);
  jest.clearAllMocks();
  jest.mocked(useStylist).mockReturnValue(stylist);
  jest.mocked(Linking.openURL).mockResolvedValue(true);
  jest.mocked(stylist.updateStatus).mockResolvedValue(undefined);
  jest.mocked(stylist.saveAvailability).mockResolvedValue({ workDays: days, blocks: [], interval: 30 });
});
afterEach(() => jest.useRealTimers());

describe('ViewModels del estilista', () => {
  it('calcula agenda y navega entre semana, día y mes', () => {
    const { result } = renderHook(() => useStylistAgendaViewModel());
    expect(result.current.dates).toHaveLength(7);
    expect(result.current.counts.get(today)).toBe(2);
    expect(result.current.estimated).toBe(true);
    act(() => result.current.movePeriod(1));
    expect(result.current.selectedKey).not.toBe(today);
    act(() => result.current.setMode('day'));
    expect(result.current.dates).toHaveLength(1);
    act(() => result.current.setMode('month'));
    expect(result.current.dates.length).toBeGreaterThan(28);
  });

  it('filtra citas por estado y búsqueda y confirma una acción', async () => {
    const { result } = renderHook(() => useStylistAppointmentsViewModel());
    expect(result.current.filtered).toHaveLength(2);
    act(() => result.current.setSearch('ANA'));
    expect(result.current.filtered.map((item) => item.id)).toEqual(['a-1']);
    act(() => result.current.setStatus('completed'));
    expect(result.current.filtered).toEqual([]);
    act(() => { result.current.setSearch(''); result.current.setAction({ appointment, status: 'confirmed' }); });
    await act(async () => result.current.performAction());
    expect(stylist.updateStatus).toHaveBeenCalledWith('a-1', 'confirmed');
    expect(result.current.feedback).toBe('Cita confirmada.');
  });

  it('muestra el error si la actualización de una cita falla', async () => {
    jest.mocked(stylist.updateStatus).mockRejectedValueOnce(new Error('Servidor ocupado'));
    const { result } = renderHook(() => useStylistAppointmentsViewModel());
    act(() => result.current.setAction({ appointment, status: 'confirmed' }));
    await act(async () => result.current.performAction());
    expect(result.current.actionError).toBe('Servidor ocupado');
  });

  it('resume citas activas, completadas y la próxima cita', () => {
    const { result } = renderHook(() => useStylistHomeViewModel());
    expect(result.current.activeToday).toHaveLength(2);
    expect(result.current.completed).toHaveLength(1);
    expect(result.current.next?.id).toBe('a-1');
    expect(result.current.metrics.find((item) => item.label === 'Completadas')?.value).toBe(1);
  });

  it('ordena avisos y calcula etiquetas relativas de tiempo', () => {
    const { result } = renderHook(() => useStylistNotificationsViewModel());
    expect(result.current.upcoming.map((item) => item.id)).toEqual(['a-1']);
    expect(result.current.recent).toHaveLength(2);
    expect(result.current.upcomingLabel(appointment, now)).toBe('En 60 min');
    expect(result.current.activityTime(appointment.updatedAt, now)).toBe('Hace 30 min');
    act(() => result.current.markNotificationsRead());
    expect(stylist.markNotificationsRead).toHaveBeenCalledTimes(1);
  });

  it('valida un bloqueo y guarda disponibilidad modificada', async () => {
    const { result } = renderHook(() => useStylistScheduleViewModel());
    expect(result.current.dirty).toBe(false);
    act(() => result.current.addBlock());
    expect(result.current.blockError).toContain('motivo');
    act(() => result.current.setBlockReason('Vacaciones'));
    act(() => result.current.addBlock());
    expect(result.current.draftBlocks).toHaveLength(1);
    expect(result.current.dirty).toBe(true);
    await act(async () => result.current.save());
    expect(stylist.saveAvailability).toHaveBeenCalledWith(days, expect.arrayContaining([expect.objectContaining({ reason: 'Vacaciones' })]), 30);
    expect(result.current.message?.error).toBe(false);
  });

  it('calcula historial, estadísticas y filtros de servicios realizados', () => {
    const { result } = renderHook(() => useStylistServicesViewModel());
    expect(result.current.completed.map((item) => item.id)).toEqual(['a-2']);
    expect(result.current.topService).toMatchObject({ name: 'Corte', count: 1 });
    expect(result.current.clients).toBe(1);
    act(() => result.current.setQuery('sin resultados'));
    expect(result.current.history).toEqual([]);
    act(() => result.current.resetFilters());
    expect(result.current.history).toHaveLength(1);
  });

  it('actualiza una cita desde el detalle y prepara llamada al cliente', async () => {
    const { result } = renderHook(() => useStylistAppointmentDetailViewModel());
    expect(result.current.appointment?.id).toBe('a-1');
    expect(result.current.nextStatus).toBe('confirmed');
    act(() => result.current.chooseAction('confirmed'));
    await act(async () => result.current.performAction());
    expect(stylist.updateStatus).toHaveBeenCalledWith('a-1', 'confirmed');
    expect(result.current.feedback).toBe('Cita confirmada.');
    act(() => result.current.chooseContact('call'));
    await act(async () => result.current.openContact());
    expect(Linking.openURL).toHaveBeenCalledWith('tel:+525512345678');
  });

  it('informa fallo al contactar y al actualizar', async () => {
    jest.mocked(Linking.openURL).mockRejectedValueOnce(new Error('Sin aplicación'));
    jest.mocked(stylist.updateStatus).mockRejectedValueOnce(new Error('Cita modificada'));
    const { result } = renderHook(() => useStylistAppointmentDetailViewModel());
    act(() => result.current.chooseContact('message'));
    await act(async () => result.current.openContact());
    expect(result.current.actionError).toContain('contacto');
    act(() => result.current.chooseAction('confirmed'));
    await act(async () => result.current.performAction());
    expect(result.current.actionError).toBe('Cita modificada');
  });
});
