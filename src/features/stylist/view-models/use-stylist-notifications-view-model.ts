import { addDays, dateKey, formatDate, parseDate, type StylistAppointment } from '../models/stylist';
import { useStylist } from '../view-models/stylist-provider';

const activityDescriptions = {
  pending: 'La cita está pendiente de confirmación.',
  confirmed: 'La cita fue confirmada.',
  completed: 'La cita fue marcada como completada.',
  cancelled: 'La cita fue cancelada.',
};

function appointmentTime(appointment: StylistAppointment) {
  const date = parseDate(appointment.date);
  const [hours, minutes] = appointment.start.split(':').map(Number);
  date.setHours(hours, minutes, 0, 0);
  return date.getTime();
}

function upcomingLabel(appointment: StylistAppointment, now: Date) {
  const minutesUntil = Math.ceil((appointmentTime(appointment) - now.getTime()) / 60000);
  if (minutesUntil <= 60) return `En ${minutesUntil} min`;
  if (appointment.date === dateKey(now)) return `Hoy · ${appointment.start}`;
  if (appointment.date === dateKey(addDays(now, 1))) return `Mañana · ${appointment.start}`;
  return `${formatDate(appointment.date, { weekday: 'short', day: 'numeric', month: 'short' })} · ${appointment.start}`;
}

function activityTime(value: string, now: Date) {
  const elapsed = Math.floor((now.getTime() - new Date(value).getTime()) / 60000);
  if (elapsed < 1) return 'Hace un momento';
  if (elapsed < 60) return `Hace ${elapsed} min`;
  const hours = Math.floor(elapsed / 60);
  return `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
}

export function useStylistNotificationsViewModel() {

  const { appointments, notificationsRead, readAt, markNotificationsRead, lastUpdated, refresh, refreshing } = useStylist();
  const now = new Date();
  const upcoming = appointments.filter((appointment) =>
    (appointment.status === 'pending' || appointment.status === 'confirmed') && appointmentTime(appointment) > now.getTime())
    .sort((first, second) => appointmentTime(first) - appointmentTime(second));
  const recent = appointments.filter((appointment) => {
    const elapsed = now.getTime() - new Date(appointment.updatedAt).getTime();
    return elapsed >= 0 && elapsed <= 24 * 60 * 60 * 1000;
  }).sort((first, second) => new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime());

  return { activityDescriptions, appointmentTime, upcomingLabel, activityTime, notificationsRead, readAt, markNotificationsRead, lastUpdated, refresh, refreshing, now, upcoming, recent };
}
