import type { ImageSourcePropType } from 'react-native';

import type { PublicCompanyInformation } from './public-content';

export type ContactSchedule = { days: string; hours: string };
export type OpeningInterval = { start: number; end: number };
export type PublicContact = {
  address?: string;
  locationReference?: string;
  phone?: string;
  whatsApp?: string;
  email?: string;
  coordinates?: { latitude: number; longitude: number };
  directionsUrl?: string;
  mapImage?: ImageSourcePropType;
  schedule: ContactSchedule[];
  timeZone?: string;
  weeklyHours?: OpeningInterval[][];
};

const dayNames = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

function normalizedText(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-MX');
}

function parseMinutes(hour: string, minute: string | undefined, period: string | undefined) {
  let result = Number(hour) * 60 + Number(minute || 0);
  const normalizedPeriod = period?.toLocaleLowerCase('es-MX');
  if (normalizedPeriod === 'pm' && Number(hour) < 12) result += 12 * 60;
  if (normalizedPeriod === 'am' && Number(hour) === 12) result -= 12 * 60;
  return result >= 0 && result < 1440 ? result : undefined;
}

function scheduleDays(label: string) {
  const normalized = normalizedText(label);
  const mentioned = dayNames
    .map((day, index) => ({ index, position: normalized.indexOf(day) }))
    .filter((item) => item.position >= 0)
    .sort((left, right) => left.position - right.position)
    .map((item) => item.index);

  if (!mentioned.length) return [];
  if (mentioned.length === 1 || !/\b(a|al|hasta)\b/.test(normalized)) return mentioned;

  const range: number[] = [];
  let current = mentioned[0];
  for (let count = 0; count < 7; count += 1) {
    range.push(current);
    if (current === mentioned.at(-1)) break;
    current = (current + 1) % 7;
  }
  return range;
}

function parseScheduleLine(value: string) {
  const separator = value.indexOf(':');
  const days = separator >= 0 ? value.slice(0, separator).trim() : 'Horario';
  const hours = separator >= 0 ? value.slice(separator + 1).trim() : value.trim();
  const matches = Array.from(hours.matchAll(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/gi));
  const start = matches[0] ? parseMinutes(matches[0][1], matches[0][2], matches[0][3]) : undefined;
  const end = matches[1] ? parseMinutes(matches[1][1], matches[1][2], matches[1][3]) : undefined;

  return {
    display: { days, hours },
    dayIndexes: scheduleDays(days),
    interval: start !== undefined && end !== undefined && end > start ? { start, end } : undefined,
  };
}

export function createPublicContact(company: PublicCompanyInformation): PublicContact {
  const scheduleLines = [company.mondayToSaturdaySchedule, company.sundaySchedule]
    .map((value) => value.trim())
    .filter(Boolean)
    .map(parseScheduleLine);
  const weeklyHours: OpeningInterval[][] = Array.from({ length: 7 }, () => []);

  scheduleLines.forEach((line) => {
    if (!line.interval) return;
    line.dayIndexes.forEach((day) => weeklyHours[day].push(line.interval!));
  });

  const { latitude, longitude, googleMapsUrl } = company.map;
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);

  return {
    address: company.address || undefined,
    phone: company.phone || undefined,
    whatsApp: company.phone || undefined,
    email: company.email || undefined,
    coordinates: hasCoordinates ? { latitude: latitude!, longitude: longitude! } : undefined,
    directionsUrl: googleMapsUrl || undefined,
    schedule: scheduleLines.map((line) => line.display),
    timeZone: weeklyHours.some((day) => day.length) ? 'America/Mexico_City' : undefined,
    weeklyHours: weeklyHours.some((day) => day.length) ? weeklyHours : undefined,
  };
}

export function getOpeningStatus(data: PublicContact, now: Date): boolean | undefined {
  const week = data.weeklyHours;
  if (!data.timeZone || !week || week.length !== 7 ||
    !week.every((day) => Array.isArray(day) && day.every((slot) =>
      Number.isInteger(slot.start) && Number.isInteger(slot.end) &&
      slot.start >= 0 && slot.start < 1440 && slot.end > slot.start && slot.end <= 2880))) {
    return undefined;
  }

  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: data.timeZone,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now);
    const part = (type: string) => parts.find((item) => item.type === type)?.value;
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(part('weekday') ?? '');
    const minute = Number(part('hour')) * 60 + Number(part('minute'));
    if (day < 0 || !Number.isFinite(minute)) return undefined;

    return week[day].some((slot) => minute >= slot.start && minute < slot.end) ||
      week[(day + 6) % 7].some((slot) => slot.end > 1440 && minute < slot.end - 1440);
  } catch {
    return undefined;
  }
}
