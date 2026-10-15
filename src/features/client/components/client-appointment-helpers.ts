import type { ClientAppointment } from '@/features/client/models/client-appointment';

const dateFormatter = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'long',
  weekday: 'long',
  year: 'numeric',
});

const shortDateFormatter = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'short',
  weekday: 'short',
});

const timeFormatter = new Intl.DateTimeFormat('es-MX', {
  hour: '2-digit',
  minute: '2-digit',
});

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  currency: 'MXN',
  minimumFractionDigits: 2,
  style: 'currency',
});

const API_WALL_TIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(?:Z|[+-]\d{2}:?\d{2})$/;

function pad(value: number) {
  return String(value).padStart(2, '0');
}

export function dateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayDateKey() {
  return dateKey(new Date());
}

export function addDaysToDateKey(value: string, days: number) {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + days);
  return dateKey(date);
}

export function formatCalendarDate(value: string) {
  const date = value.includes('T')
    ? parseAppointmentDateTime(value)
    : new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  const formatted = dateFormatter.format(date);
  return formatted.charAt(0).toLocaleUpperCase('es-MX') + formatted.slice(1);
}

export function formatShortDate(value: string) {
  const date = new Date(value.includes('T') ? value : `${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return shortDateFormatter.format(date).replace('.', '');
}

export function formatAppointmentTime(value: string) {
  const date = parseAppointmentDateTime(value);
  return Number.isNaN(date.getTime()) ? value : timeFormatter.format(date);
}

/**
 * The current appointments API builds a Date from a date/time without an
 * offset. Render runs in UTC, so the ISO response contains the selected wall
 * time as UTC fields (10:00 is returned as 10:00Z). Rebuild those fields in
 * the device timezone so the client keeps the exact slot the user selected.
 */
export function parseAppointmentDateTime(value: string) {
  const match = value.match(API_WALL_TIME_PATTERN);
  if (!match) return new Date(value);

  const [, year, month, day, hour, minute, second = '0', millisecond = '0'] = match;
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
    Number(millisecond.padEnd(3, '0')),
  );
}

export function formatSlotTime(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value;
  const date = new Date(2000, 0, 1, hours, minutes);
  return timeFormatter.format(date);
}

export function formatClientPrice(value: number) {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0);
}

export function getClientErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message.trim() ? error.message : fallback;
}

export function isUpcomingAppointment(appointment: ClientAppointment) {
  if (appointment.status === 'cancelada' || appointment.status === 'completada') return false;
  const time = parseAppointmentDateTime(appointment.dateTime).getTime();
  return Number.isNaN(time) || time >= Date.now();
}

export function canModifyAppointment(appointment: ClientAppointment) {
  return isUpcomingAppointment(appointment) &&
    (appointment.status === 'pendiente' || appointment.status === 'confirmada');
}

export function canPayAppointment(appointment: ClientAppointment) {
  return canModifyAppointment(appointment) &&
    (appointment.paymentStatus === 'Sin pago' || appointment.paymentStatus === 'Rechazado') &&
    Boolean(appointment.serviceId);
}
