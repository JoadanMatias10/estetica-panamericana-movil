import type { ScheduleBlock, StylistAppointment, WorkDay } from './stylist';

export function clockMinutes(value: string) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return Number.NaN;
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

export function clockLabel(value: number) {
  return `${Math.floor(value / 60).toString().padStart(2, '0')}:${(value % 60).toString().padStart(2, '0')}`;
}

export function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function dayValidation(day: WorkDay): string | undefined {
  if (!day.active) return undefined;
  const start = clockMinutes(day.start);
  const end = clockMinutes(day.end);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return `${day.label}: usa horas en formato HH:mm.`;
  if (end <= start) return `${day.label}: la salida debe ser posterior a la entrada.`;
  if (!day.breakStart && !day.breakEnd) return undefined;
  const breakStart = clockMinutes(day.breakStart ?? '');
  const breakEnd = clockMinutes(day.breakEnd ?? '');
  if (!Number.isFinite(breakStart) || !Number.isFinite(breakEnd)) return `${day.label}: completa las dos horas del descanso o deja ambas vacías.`;
  if (breakEnd <= breakStart || breakStart < start || breakEnd > end) return `${day.label}: el descanso debe estar dentro de la jornada y terminar después de su inicio.`;
  if (breakStart === start && breakEnd === end) return `${day.label}: el descanso no puede ocupar toda la jornada.`;
  return undefined;
}

export function blockValidation(block: Pick<ScheduleBlock, 'date' | 'start' | 'end'>): string | undefined {
  if (!validDate(block.date)) return 'Escribe una fecha válida en formato YYYY-MM-DD.';
  const start = clockMinutes(block.start);
  const end = clockMinutes(block.end);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 'Escribe las horas en formato HH:mm (por ejemplo, 09:30).';
  if (end <= start) return 'El bloqueo debe terminar después de su hora de inicio.';
  return undefined;
}

type Range = { start: number; end: number; };
export type AgendaRow = Range & {
  id: string;
  kind: 'appointment' | 'free' | 'break' | 'block';
  title: string;
  appointment?: StylistAppointment;
};

function overlaps(first: Range, second: Range) {
  return first.start < second.end && first.end > second.start;
}

function dayNumber(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day, 12).getDay();
}

export function availabilityConflict(appointment: StylistAppointment, days: WorkDay[], blocks: ScheduleBlock[]) {
  const workDay = days.find((day) => day.weekday === dayNumber(appointment.date));
  const range = { start: clockMinutes(appointment.start), end: clockMinutes(appointment.start) + appointment.duration };
  if (!workDay?.active || dayValidation(workDay)) return true;
  if (range.start < clockMinutes(workDay.start) || range.end > clockMinutes(workDay.end)) return true;
  if (workDay.breakStart && workDay.breakEnd && overlaps(range, { start: clockMinutes(workDay.breakStart), end: clockMinutes(workDay.breakEnd) })) return true;
  return blocks.some((block) => block.date <= appointment.date && (block.endDate || block.date) >= appointment.date &&
    (block.allDay || overlaps(range, { start: clockMinutes(block.start), end: clockMinutes(block.end) })));
}

export function dayAgenda(date: string, days: WorkDay[], blocks: ScheduleBlock[], appointments: StylistAppointment[]) {
  const workDay = days.find((day) => day.weekday === dayNumber(date));
  const dayAppointments = appointments.filter((appointment) => appointment.date === date);
  const rows: AgendaRow[] = dayAppointments.map((appointment) => ({
    id: appointment.id,
    kind: 'appointment',
    title: appointment.client,
    start: clockMinutes(appointment.start),
    end: clockMinutes(appointment.start) + appointment.duration,
    appointment,
  }));
  const dayBlocks: AgendaRow[] = blocks.filter((block) => block.date <= date && (block.endDate || block.date) >= date).map((block) => ({
    id: `block-${block.id}`, kind: 'block', title: block.reason || 'Horario bloqueado',
    start: block.allDay ? 0 : clockMinutes(block.start), end: block.allDay ? 1440 : clockMinutes(block.end),
  }));
  rows.push(...dayBlocks);
  if (workDay?.active && !dayValidation(workDay)) {
    const start = clockMinutes(workDay.start);
    const end = clockMinutes(workDay.end);
    const busy: Range[] = rows.filter((row) => row.appointment?.status !== 'cancelled');
    if (workDay.breakStart && workDay.breakEnd) {
      const rest: AgendaRow = { id: 'break', kind: 'break', title: 'Descanso', start: clockMinutes(workDay.breakStart), end: clockMinutes(workDay.breakEnd) };
      rows.push(rest);
      busy.push(rest);
    }
    const ranges = busy.map((range) => ({ start: Math.max(start, range.start), end: Math.min(end, range.end) }))
      .filter((range) => range.end > range.start).sort((a, b) => a.start - b.start);
    let cursor = start;
    for (const range of ranges) {
      if (range.start > cursor) rows.push({ id: `free-${cursor}`, kind: 'free', title: 'Disponible', start: cursor, end: range.start });
      cursor = Math.max(cursor, range.end);
    }
    if (cursor < end) rows.push({ id: `free-${cursor}`, kind: 'free', title: 'Disponible', start: cursor, end });
  }
  rows.sort((a, b) => a.start - b.start || (a.kind === 'appointment' ? -1 : 1));
  return { workDay, appointments: dayAppointments, rows, freeCount: rows.filter((row) => row.kind === 'free').length };
}
