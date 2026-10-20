export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export type StylistAppointment = {
  id: string;
  client: string;
  service: string;
  phone: string;
  email: string;
  date: string;
  start: string;
  duration: number;
  durationEstimated?: boolean;
  status: AppointmentStatus;
  assigned: boolean;
  notes: string;
  updatedAt: string;
};

export type WorkDay = {
  weekday: number;
  label: string;
  active: boolean;
  start: string;
  end: string;
  breakStart: string;
  breakEnd: string;
};

export type ScheduleBlock = {
  id: string;
  date: string;
  endDate?: string;
  allDay?: boolean;
  start: string;
  end: string;
  reason: string;
};

export type AppointmentPeriod = 'today' | 'week' | 'month' | 'all';

export const statusLabels: Record<AppointmentStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

export const statusColors: Record<AppointmentStatus, { color: string; background: string; }> = {
  pending: { color: '#92400E', background: '#FEF3C7' },
  confirmed: { color: '#7C3AED', background: '#F3EEFF' },
  completed: { color: '#047857', background: '#D1FAE5' },
  cancelled: { color: '#BE185D', background: '#FCE7F3' },
};

export function dateKey(date: Date) {
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function parseDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return new Date(Number.NaN);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const result = new Date(year, month - 1, day);
  if (result.getFullYear() !== year || result.getMonth() !== month - 1 || result.getDate() !== day) {
    return new Date(Number.NaN);
  }
  return result;
}

export function addDays(date: Date, amount: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

export function startOfWeek(date: Date) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return addDays(result, -((result.getDay() + 6) % 7));
}

export function formatDate(value: string | Date, options?: Intl.DateTimeFormatOptions) {
  const date = typeof value === 'string' ? parseDate(value) : value;
  if (Number.isNaN(date.getTime())) return 'Fecha no disponible';
  return new Intl.DateTimeFormat('es-MX', options ?? {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function minutes(time: string) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return Number.NaN;
  const [hours, minute] = time.split(':').map(Number);
  return hours * 60 + minute;
}

export function timeLabel(value: number) {
  if (!Number.isFinite(value) || value < 0 || value > 24 * 60) return '--:--';
  const rounded = Math.floor(value);
  return `${String(Math.floor(rounded / 60)).padStart(2, '0')}:${String(rounded % 60).padStart(2, '0')}`;
}

export function inPeriod(
  appointment: StylistAppointment,
  period: AppointmentPeriod,
  reference = new Date(),
) {
  if (period === 'all') return true;
  const date = parseDate(appointment.date);
  if (Number.isNaN(date.getTime()) || Number.isNaN(reference.getTime())) return false;
  if (period === 'today') return appointment.date === dateKey(reference);
  if (period === 'month') {
    return date.getFullYear() === reference.getFullYear() && date.getMonth() === reference.getMonth();
  }
  const start = startOfWeek(reference);
  return date >= start && date < addDays(start, 7);
}

export function initials(name: string) {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2)
    .map((part) => part[0].toLocaleUpperCase('es-MX')).join('') || 'EP';
}

export function canUpdateStatus(current: AppointmentStatus, next: AppointmentStatus) {
  return (current === 'pending' && (next === 'confirmed' || next === 'cancelled')) ||
    (current === 'confirmed' && (next === 'completed' || next === 'cancelled'));
}

export function validateAvailability(days: WorkDay[], blocks: ScheduleBlock[], interval: number) {
  const errors: string[] = [];
  if (!Number.isInteger(interval) || interval < 15 || interval > 240) errors.push('El intervalo debe ser de 15 a 240 minutos.');
  if (days.length !== 7 || new Set(days.map((day) => day.weekday)).size !== 7 ||
    days.some((day) => !Number.isInteger(day.weekday) || day.weekday < 0 || day.weekday > 6)) {
    errors.push('El horario debe incluir una vez cada día de la semana.');
  }

  for (const day of days) {
    if (!day.active) continue;
    const start = minutes(day.start);
    const end = minutes(day.end);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      errors.push(`${day.label}: la hora de salida debe ser posterior a la entrada (HH:mm).`);
      continue;
    }
    if (day.breakStart || day.breakEnd) {
      const breakStart = minutes(day.breakStart);
      const breakEnd = minutes(day.breakEnd);
      if (!Number.isFinite(breakStart) || !Number.isFinite(breakEnd) ||
        breakStart < start || breakEnd > end || breakEnd <= breakStart) {
        errors.push(`${day.label}: el descanso debe estar dentro de la jornada y tener inicio y fin válidos.`);
      } else if (breakStart === start && breakEnd === end) {
        errors.push(`${day.label}: el descanso no puede ocupar toda la jornada.`);
      }
    }
  }

  const blockIds = new Set<string>();
  for (const block of blocks) {
    if (!block.id.trim() || blockIds.has(block.id)) errors.push('Cada bloqueo debe tener un identificador único.');
    blockIds.add(block.id);
    const start = minutes(block.start);
    const end = minutes(block.end);
    if (Number.isNaN(parseDate(block.date).getTime()) || (block.endDate &&
      (Number.isNaN(parseDate(block.endDate).getTime()) || block.endDate < block.date))) errors.push('Selecciona fechas válidas para el bloqueo.');
    if (!block.allDay && (!Number.isFinite(start) || !Number.isFinite(end) || end <= start)) {
      errors.push('El bloqueo debe tener un inicio y un fin válidos (HH:mm).');
    }
  }

  for (let index = 0;index < blocks.length;index += 1) {
    const block = blocks[index];
    if (blocks.slice(index + 1).some((other) => other.date <= (block.endDate || block.date) &&
      block.date <= (other.endDate || other.date) && (block.allDay || other.allDay ||
        (minutes(other.start) < minutes(block.end) && minutes(block.start) < minutes(other.end))))) {
      errors.push('Los bloqueos de una misma fecha no pueden superponerse.');
      break;
    }
  }
  return errors;
}
