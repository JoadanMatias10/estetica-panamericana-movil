import type { ImageSourcePropType } from 'react-native';

export type ContactSchedule = { days: string; hours: string };
export type OpeningInterval = { start: number; end: number }; // Minutes from midnight; end > start.
export type PublicContact = {
  address?: string;
  locationReference?: string;
  phone?: string; // International format, including country code.
  whatsApp?: string; // International format, including country code.
  email?: string;
  coordinates?: { latitude: number; longitude: number };
  directionsUrl?: string; // Official HTTPS maps link.
  mapImage?: ImageSourcePropType; // Map image must already include the location marker.
  schedule: ContactSchedule[];
  timeZone?: string; // Confirmed IANA timezone of the establishment.
  weeklyHours?: OpeningInterval[][]; // Sunday=0. Seven days; [] means closed.
};

// Pending official information. Replace here, or pass server data to the ViewModel later.
// mapImage example: require('../../../../assets/images/contact-map.png')
export const publicContact: PublicContact = {
  address: undefined,
  locationReference: undefined,
  phone: undefined,
  whatsApp: undefined,
  email: undefined,
  coordinates: undefined,
  directionsUrl: undefined,
  mapImage: undefined,
  schedule: [],
  timeZone: undefined,
  weeklyHours: undefined,
};

export function getOpeningStatus(data: PublicContact, now: Date): boolean | undefined {
  const week = data.weeklyHours;
  if (!data.timeZone || !week || week.length !== 7 ||
    !week.every(day => Array.isArray(day) && day.every(slot =>
      Number.isInteger(slot.start) && Number.isInteger(slot.end) &&
      slot.start >= 0 && slot.start < 1440 && slot.end > slot.start && slot.end <= 2880))) {
    return undefined;
  }
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: data.timeZone, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(now);
    const part = (type: string) => parts.find(item => item.type === type)?.value;
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(part('weekday') ?? '');
    const minute = Number(part('hour')) * 60 + Number(part('minute'));
    if (day < 0 || !Number.isFinite(minute)) return undefined;
    return week[day].some(slot => minute >= slot.start && minute < slot.end) ||
      week[(day + 6) % 7].some(slot => slot.end > 1440 && minute < slot.end - 1440);
  } catch {
    return undefined;
  }
}
