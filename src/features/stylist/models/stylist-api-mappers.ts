import { dateKey, initials, minutes, parseDate, type AppointmentStatus, type ScheduleBlock, type StylistAppointment, type WorkDay } from './stylist';

type RecordValue = Record<string, unknown>;
export function record(value: unknown): RecordValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('El servidor devolvió un formato inválido.');
  return value as RecordValue;
}
function array(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new Error('El servidor no devolvió la lista solicitada.');
  return value;
}
function text(value: unknown) { return typeof value === 'string' ? value.trim() : ''; }
function required(value: unknown) {
  const result = text(value);
  if (!result) throw new Error('La respuesta del servidor está incompleta.');
  return result;
}
function validDate(value: unknown) {
  const result = required(value);
  if (Number.isNaN(parseDate(result).getTime())) throw new Error('El servidor devolvió una fecha inválida.');
  return result;
}
function validTime(value: unknown) {
  const result = required(value);
  if (!Number.isFinite(minutes(result))) throw new Error('El servidor devolvió una hora inválida.');
  return result;
}

export const apiStatuses: Record<AppointmentStatus, string> = {
  pending: 'pendiente', confirmed: 'confirmada', completed: 'completada', cancelled: 'cancelada',
};
const statuses: Record<string, AppointmentStatus> = { pendiente: 'pending', programada: 'pending', confirmada: 'confirmed', completada: 'completed', cancelada: 'cancelled' };

export function mapStylistAppointment(value: unknown, slotMinutes: number): StylistAppointment {
  const item = record(value);
  const date = new Date(required(item.fechaHora));
  const status = statuses[text(item.estado).toLowerCase()];
  if (Number.isNaN(date.getTime()) || !status) throw new Error('La cita contiene una fecha o estado inválido.');
  const duration = Number(item.duracionMinutos);
  const durationEstimated = !Number.isFinite(duration) || duration <= 0;
  const updatedAt = text(item.updatedAt) || text(item.createdAt);
  return {
    id: required(item.id || item._id), client: text(item.cliente) || 'Cliente',
    service: text(item.servicio) || 'Servicio', phone: text(item.clienteTelefono), email: text(item.clienteCorreo),
    date: dateKey(date), start: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
    duration: durationEstimated ? slotMinutes : duration, durationEstimated,
    status, assigned: item.asignada === true, notes: text(item.notas),
    updatedAt: Number.isNaN(new Date(updatedAt).getTime()) ? '' : new Date(updatedAt).toISOString(),
  };
}

export function mapStylistAppointments(payload: unknown, slotMinutes: number) {
  return array(record(payload).appointments).map((item) => mapStylistAppointment(item, slotMinutes));
}

export type StylistIdentity = { id: string; name: string; initials: string; email: string; };
export function mapStylistIdentity(payload: unknown): StylistIdentity {
  const user = record(record(payload).user);
  if (user.role !== 'stylist') throw new Error('La cuenta no corresponde a un estilista.');
  const name = text(user.nombre) || 'Estilista';
  return { id: required(user.id), name, initials: initials(name), email: text(user.correo) };
}

export type StylistAvailability = { workDays: WorkDay[]; blocks: ScheduleBlock[]; interval: number; };
const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
export function mapStylistAvailability(payload: unknown): StylistAvailability {
  const value = record(record(payload).availability);
  const interval = Number(value.slotMinutes);
  if (!Number.isInteger(interval) || interval < 15 || interval > 240) throw new Error('El intervalo del servidor es inválido.');
  const workDays = array(value.weeklySchedule).map((entry): WorkDay => {
    const day = record(entry);
    const weekday = Number(day.day);
    if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6 || typeof day.enabled !== 'boolean') throw new Error('El horario del servidor es inválido.');
    return {
      weekday, label: weekdays[weekday], active: day.enabled, start: validTime(day.startTime), end: validTime(day.endTime),
      breakStart: text(day.breakStart), breakEnd: text(day.breakEnd)
    };
  }).sort((a, b) => ((a.weekday + 6) % 7) - ((b.weekday + 6) % 7));
  if (workDays.length !== 7 || new Set(workDays.map((day) => day.weekday)).size !== 7) throw new Error('El horario semanal está incompleto.');
  const blocks = array(value.blockedPeriods).map((entry, index): ScheduleBlock => {
    const block = record(entry);
    const allDay = block.allDay !== false;
    return {
      id: text(block.id) || `server-block-${index}`, date: validDate(block.startDate), endDate: validDate(block.endDate), allDay,
      start: allDay ? '00:00' : validTime(block.startTime), end: allDay ? '23:59' : validTime(block.endTime), reason: text(block.reason)
    };
  });
  return { workDays, blocks, interval };
}

export function availabilityPayload(days: WorkDay[], blocks: ScheduleBlock[], interval: number) {
  return {
    slotMinutes: interval,
    weeklySchedule: days.map((day) => ({ day: day.weekday, enabled: day.active, startTime: day.start, endTime: day.end, breakStart: day.breakStart, breakEnd: day.breakEnd })),
    blockedPeriods: blocks.map((block) => ({
      startDate: block.date, endDate: block.endDate || block.date, allDay: block.allDay === true,
      startTime: block.allDay ? '' : block.start, endTime: block.allDay ? '' : block.end, reason: block.reason
    })),
  };
}
