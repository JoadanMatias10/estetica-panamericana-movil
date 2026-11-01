/// <reference types="jest" />
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import { addDays, dateKey, type StylistAppointment, type WorkDay } from '../src/features/stylist/models/stylist';
import { useStylist } from '../src/features/stylist/view-models/stylist-provider';
import { StylistAgendaScreen } from '../src/features/stylist/views/stylist-agenda-screen';
import { StylistAppointmentDetailScreen } from '../src/features/stylist/views/stylist-appointment-detail-screen';
import { StylistAppointmentsScreen } from '../src/features/stylist/views/stylist-appointments-screen';
import { StylistHomeScreen } from '../src/features/stylist/views/stylist-home-screen';
import { StylistNotificationsScreen } from '../src/features/stylist/views/stylist-notifications-screen';
import { StylistScheduleScreen } from '../src/features/stylist/views/stylist-schedule-screen';
import { StylistServicesScreen } from '../src/features/stylist/views/stylist-services-screen';

jest.mock('expo-router', () => ({
  router: { navigate: jest.fn(), push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => true) },
  useLocalSearchParams: () => ({ id: 'a-1' }),
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('expo-image', () => ({ Image: () => null }));
jest.mock('expo-linking', () => ({ openURL: jest.fn() }));
jest.mock('../src/features/stylist/view-models/stylist-provider', () => ({ useStylist: jest.fn() }));
jest.mock('../src/shared/components/app-screen', () => ({
  AppScreen: ({ children }: { children: React.ReactNode }) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
}));

// Las citas y el reloj comparten una fecha fija para no depender del día de ejecución.
const referenceDate = new Date(2026, 10, 2, 10);
const today = dateKey(referenceDate);
const tomorrow = dateKey(addDays(referenceDate, 1));
const appointment: StylistAppointment = {
  id: 'a-1', client: 'Ana López', service: 'Corte', phone: '+52 55 1234 5678', email: 'ana@example.test',
  date: today, start: '13:00', duration: 30, durationEstimated: true, status: 'pending', assigned: true,
  notes: 'Sin productos', updatedAt: referenceDate.toISOString(),
};
const completed: StylistAppointment = {
  ...appointment, id: 'a-2', client: 'Bea', date: tomorrow, status: 'completed', start: '10:00',
};
const days: WorkDay[] = Array.from({ length: 7 }, (_, weekday) => ({
  weekday, label: `Día ${weekday}`, active: true, start: '09:00', end: '18:00', breakStart: '', breakEnd: '',
}));
const state = {
  appointments: [appointment, completed], workDays: days, blocks: [], interval: 30,
  identity: { id: 'stylist-1', name: 'Elena Ruiz', initials: 'ER' }, hasData: true,
  checkingSession: false, hasSession: true, refreshing: false, busy: false, error: '',
  lastUpdated: referenceDate.toISOString(), notificationsRead: false, unreadCount: 1, readAt: '',
  refresh: jest.fn(), updateStatus: jest.fn(), saveAvailability: jest.fn(),
  markNotificationsRead: jest.fn(), signOut: jest.fn(),
} as unknown as ReturnType<typeof useStylist>;

beforeEach(() => {
  jest.useFakeTimers({ now: referenceDate });
  jest.clearAllMocks();
  jest.mocked(useStylist).mockReturnValue(state);
  jest.mocked(state.updateStatus).mockResolvedValue(undefined);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('pantallas del estilista', () => {
  it('muestra la próxima cita y abre su detalle desde inicio', () => {
    const screen = render(<StylistHomeScreen />);
    expect(screen.getByText('Hola, Elena')).toBeTruthy();
    expect(screen.getByText('Ana López')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Ver cita de Ana López a las 13:00'));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/stylist/appointments/[id]', params: { id: 'a-1' } });
    fireEvent.press(screen.getByText('Cerrar sesión'));
    expect(state.signOut).toHaveBeenCalledTimes(1);
  });

  it('muestra un inicio vacío y permite abrir agenda', () => {
    jest.mocked(useStylist).mockReturnValue({ ...state, appointments: [] });
    const screen = render(<StylistHomeScreen />);
    expect(screen.getByText('Hoy no tienes citas')).toBeTruthy();
    fireEvent.press(screen.getByText('Ir a mi agenda'));
    expect(router.navigate).toHaveBeenCalledWith('/stylist/agenda');
  });

  it('filtra citas por búsqueda y abre el detalle', () => {
    const screen = render(<StylistAppointmentsScreen />);
    expect(screen.getByText('2 citas')).toBeTruthy();
    fireEvent.changeText(screen.getByLabelText('Cliente o servicio'), 'Ana');
    expect(screen.getByText('1 cita')).toBeTruthy();
    fireEvent.press(screen.getByText('Ver detalle'));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/stylist/appointments/[id]', params: { id: 'a-1' } });
  });

  it.each([
    { day: 'domingo', now: new Date(2026, 10, 1, 10), visibleClient: 'Ana López', hiddenClient: 'Bea' },
    { day: 'lunes', now: new Date(2026, 10, 2, 10), visibleClient: 'Bea', hiddenClient: 'Ana López' },
  ])('mantiene separadas las citas de cada semana el $day', ({ now, visibleClient, hiddenClient }) => {
    jest.setSystemTime(now);
    jest.mocked(useStylist).mockReturnValue({
      ...state,
      appointments: [
        { ...appointment, date: '2026-11-01' },
        { ...completed, date: '2026-11-02' },
      ],
    });

    const screen = render(<StylistAppointmentsScreen />);

    expect(screen.getByText('1 cita')).toBeTruthy();
    expect(screen.getByText(visibleClient)).toBeTruthy();
    expect(screen.queryByText(hiddenClient)).toBeNull();
  });

  it('ofrece limpiar filtros cuando no hay citas', () => {
    jest.mocked(useStylist).mockReturnValue({ ...state, appointments: [] });
    const screen = render(<StylistAppointmentsScreen />);
    fireEvent.press(screen.getByText('Limpiar filtros'));
    expect(screen.getByText('0 citas')).toBeTruthy();
  });

  it('pide confirmación antes de cambiar el estado de una cita', async () => {
    const screen = render(<StylistAppointmentsScreen />);
    fireEvent.press(screen.getByText('Confirmar'));
    expect(screen.getByText('La cita quedará confirmada y asignada a ti.')).toBeTruthy();
    fireEvent.press(screen.getByText('Sí, confirmar cita'));
    await waitFor(() => expect(state.updateStatus).toHaveBeenCalledWith('a-1', 'confirmed'));
  });

  it('navega por el calendario y abre la cita del día', () => {
    const screen = render(<StylistAgendaScreen />);
    fireEvent.press(screen.getByLabelText('Periodo siguiente'));
    fireEvent.press(screen.getByText('Hoy'));
    expect(screen.getAllByText(/periodos libres/).length).toBeGreaterThan(0);
    fireEvent.press(screen.getByLabelText('Ver cita de Ana López a las 13:00'));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/stylist/appointments/[id]', params: { id: 'a-1' } });
  });

  it('avisa de un día sin citas y permite ir al horario', () => {
    jest.mocked(useStylist).mockReturnValue({ ...state, appointments: [], workDays: days.map((day) => ({ ...day, active: false })) });
    const screen = render(<StylistAgendaScreen />);
    expect(screen.getByText('Tu día está libre')).toBeTruthy();
    fireEvent.press(screen.getByText('Ver horario'));
    expect(router.push).toHaveBeenCalledWith('/stylist/schedule');
  });

  it('edita un día e intenta guardar la disponibilidad', async () => {
    const screen = render(<StylistScheduleScreen />);
    fireEvent.press(screen.getByLabelText('Editar horario de Día 0'));
    expect(screen.getByLabelText('Entrada · Día 0')).toBeTruthy();
    fireEvent.changeText(screen.getByLabelText('Entrada · Día 0'), '10:00');
    fireEvent.press(screen.getByText('Guardar disponibilidad'));
    await waitFor(() => expect(state.saveAvailability).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ weekday: 0, start: '10:00' })]), [], 30,
    ));
  });

  it('agrega y elimina un bloqueo desde el horario', () => {
    const screen = render(<StylistScheduleScreen />);
    fireEvent.press(screen.getByText('+ Agregar'));
    fireEvent.changeText(screen.getByLabelText('Motivo del bloqueo'), 'Vacaciones');
    fireEvent.press(screen.getByText('Agregar a mi horario'));
    expect(screen.getByText('Vacaciones')).toBeTruthy();
    fireEvent.press(screen.getByLabelText(`Eliminar bloqueo del ${today} a las 13:00`));
    expect(screen.queryByText('Vacaciones')).toBeNull();
  });

  it('muestra notificaciones y permite marcarlas como leídas', () => {
    const screen = render(<StylistNotificationsScreen />);
    fireEvent.press(screen.getByText('Marcar como leídas'));
    expect(state.markNotificationsRead).toHaveBeenCalledTimes(1);
    expect(screen.getAllByText('Ana López').length).toBeGreaterThan(0);
  });

  it('muestra estados vacíos cuando ya se leyeron todas las notificaciones', () => {
    jest.mocked(useStylist).mockReturnValue({ ...state, appointments: [], notificationsRead: true });
    const screen = render(<StylistNotificationsScreen />);
    expect(screen.getByText('Sin próximas citas')).toBeTruthy();
    expect(screen.getByText('Sin actividad reciente')).toBeTruthy();
    expect(screen.getByText('Tus notificaciones están marcadas como leídas.')).toBeTruthy();
  });

  it('presenta el historial de servicios realizados y sus filtros', () => {
    const screen = render(<StylistServicesScreen />);
    expect(screen.getByText('Servicios realizados')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Seleccionar período y tipo de servicio'));
    expect(screen.getByText('Filtrar servicios')).toBeTruthy();
  });

  it('permite recuperar el historial cuando no hay servicios completados', () => {
    jest.mocked(useStylist).mockReturnValue({ ...state, appointments: [] });
    const screen = render(<StylistServicesScreen />);
    fireEvent.press(screen.getByText('Ver todo el historial'));
    expect(screen.getByText('Sin servicios')).toBeTruthy();
  });

  it('confirma una cita desde su detalle', async () => {
    const screen = render(<StylistAppointmentDetailScreen />);
    fireEvent.press(screen.getByText('Confirmar cita'));
    fireEvent.press(screen.getAllByText('Confirmar cita').at(-1)!);
    await waitFor(() => expect(state.updateStatus).toHaveBeenCalledWith('a-1', 'confirmed'));
  });

  it('informa cuando una cita ya no está disponible', () => {
    jest.mocked(useStylist).mockReturnValue({ ...state, appointments: [] });
    const screen = render(<StylistAppointmentDetailScreen />);
    fireEvent.press(screen.getByText('Ver citas'));
    expect(router.replace).toHaveBeenCalledWith('/stylist/appointments');
  });

  it('muestra que una cita completada ya no acepta acciones', () => {
    jest.mocked(useStylist).mockReturnValue({ ...state, appointments: [{ ...appointment, status: 'completed' }] });
    const screen = render(<StylistAppointmentDetailScreen />);
    expect(screen.getByText('Este servicio ya forma parte de tu historial.')).toBeTruthy();
    expect(screen.queryByText('Cancelar cita')).toBeNull();
  });

  it('advierte que una cita sin estilista se asignará al confirmarla', () => {
    jest.mocked(useStylist).mockReturnValue({ ...state, appointments: [{ ...appointment, assigned: false, phone: '', email: '', notes: '' }] });
    const screen = render(<StylistAppointmentDetailScreen />);
    expect(screen.getByText('Sin estilista asignado')).toBeTruthy();
    expect(screen.getByText('Al confirmar esta cita quedará asignada a ti.')).toBeTruthy();
    expect(screen.getByText('El cliente no agregó notas a esta cita.')).toBeTruthy();
    expect(screen.getByText('Llamar')).toBeTruthy();
  });

  it('muestra la cita cancelada sin permitir cambios de estado', () => {
    jest.mocked(useStylist).mockReturnValue({ ...state, appointments: [{ ...appointment, status: 'cancelled' }] });
    const screen = render(<StylistAppointmentDetailScreen />);
    expect(screen.getByText('Esta cita fue cancelada y ya no ocupa un espacio en tu agenda.')).toBeTruthy();
    expect(screen.getByText('Puedes volver a Citas para revisar otras reservaciones.')).toBeTruthy();
    expect(screen.queryByText('Cambiar estado')).toBeNull();
  });

  it('permite elegir un canal de contacto desde el detalle de cita', () => {
    const screen = render(<StylistAppointmentDetailScreen />);
    fireEvent.press(screen.getByText('Mensaje'));
    expect(screen.getByText('Mensaje al cliente')).toBeTruthy();
    expect(screen.getByText('Se abrirá la aplicación de mensajes de tu dispositivo.')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Cerrar'));
    fireEvent.press(screen.getByText('Llamar'));
    expect(screen.getByText('Llamar al cliente')).toBeTruthy();
  });

  it('muestra validación del horario y permite quitar el descanso', () => {
    const screen = render(<StylistScheduleScreen />);
    fireEvent.press(screen.getByLabelText('Editar horario de Día 0'));
    fireEvent.changeText(screen.getByLabelText('Salida · Día 0'), '08:00');
    expect(screen.getByText(/salida.*después|posterior.*entrada|horario.*inválido/i)).toBeTruthy();
    fireEvent.press(screen.getAllByText('Sin descanso').at(-1)!);
    expect(screen.getByLabelText('Inicio de descanso').props.value).toBe('');
  });

  it('cambia el intervalo de disponibilidad y desactiva un día', async () => {
    const screen = render(<StylistScheduleScreen />);
    fireEvent.press(screen.getByText('45 min'));
    fireEvent(screen.getByLabelText('Día 0 laborable'), 'valueChange', false);
    expect(screen.getByText('No laborable')).toBeTruthy();
    await act(async () => fireEvent.press(screen.getByText('Guardar disponibilidad')));
    expect(state.saveAvailability).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ weekday: 0, active: false })]), [], 45,
    );
  });
});
