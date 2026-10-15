export type ClientStatusTone = 'success' | 'warning' | 'error' | 'neutral' | 'info';

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  currency: 'MXN',
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: 'currency',
});

const dateFormatter = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const shortDateFormatter = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('es-MX', {
  hour: 'numeric',
  minute: '2-digit',
});

export function formatClientCurrency(value: number) {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0);
}

export function toClientDate(value?: string | Date | null) {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function formatClientDate(value?: string | Date | null, short = false) {
  const date = toClientDate(value);
  return date ? (short ? shortDateFormatter : dateFormatter).format(date) : 'Fecha no disponible';
}

export function formatClientTime(value?: string | Date | null) {
  const date = toClientDate(value);
  return date ? timeFormatter.format(date) : 'Hora no disponible';
}

export function formatClientDateTime(value?: string | Date | null) {
  const date = toClientDate(value);
  return date ? `${dateFormatter.format(date)} · ${timeFormatter.format(date)}` : 'Fecha pendiente';
}

export function getClientInitials(...parts: (string | undefined)[]) {
  const initials = parts
    .flatMap((part) => (part || '').trim().split(/\s+/))
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase('es-MX'))
    .join('');
  return initials || 'EP';
}

export function normalizeClientStatus(value?: string) {
  return (value || '').trim().toLocaleLowerCase('es-MX');
}

export function clientStatusTone(value?: string): ClientStatusTone {
  const status = normalizeClientStatus(value);
  if (['pagado', 'confirmado', 'confirmada', 'completada', 'enviada'].includes(status)) return 'success';
  if (['pendiente', 'procesando', 'programada', 'preparada', 'lista_whatsapp'].includes(status)) return 'warning';
  if (['rechazado', 'rechazada', 'cancelada', 'fallida'].includes(status)) return 'error';
  return 'neutral';
}

export function daysUntilClientDate(value?: string | Date | null) {
  const date = toClientDate(value);
  if (!date) return undefined;
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.ceil((target.getTime() - startToday.getTime()) / 86_400_000);
}
