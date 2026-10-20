import { palette } from '@/shared/theme/tokens';
import { Ionicons } from '@expo/vector-icons';
import { dateKey } from '../models/stylist';
import { useStylist } from '../view-models/stylist-provider';

const shortcuts = [
  { title: 'Citas', icon: 'calendar-outline', href: '/stylist/appointments', color: palette.primary, background: '#FCE7F3' },
  { title: 'Mi agenda', icon: 'calendar-number-outline', href: '/stylist/agenda', color: palette.secondary, background: '#EDE9FE' },
  { title: 'Servicios realizados', icon: 'checkmark-done-outline', href: '/stylist/services', color: '#047857', background: '#D1FAE5' },
  { title: 'Horario', icon: 'time-outline', href: '/stylist/schedule', color: '#92400E', background: '#FEF3C7' },
] as const;

export function useStylistHomeViewModel() {

  const { appointments, identity, signOut, refresh, refreshing } = useStylist();
  const now = new Date();
  const today = dateKey(now);
  const todaysAppointments = appointments.filter((item) => item.date === today)
    .sort((a, b) => a.start.localeCompare(b.start));
  const activeToday = todaysAppointments.filter((item) => item.status !== 'cancelled');
  const completed = todaysAppointments.filter((item) => item.status === 'completed');
  const next = appointments.filter((item) => (item.status === 'pending' || item.status === 'confirmed') &&
    new Date(`${item.date}T${item.start}:00`).getTime() >= now.getTime())
    .sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`))[0];
  const recent = [...appointments].filter((item) => item.status !== 'pending')
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  const metrics: { label: string; value: number; color: string; background: string; icon: keyof typeof Ionicons.glyphMap; }[] = [
    { label: 'Citas de hoy', value: activeToday.length, color: palette.secondary, background: '#F3EEFF', icon: 'calendar' },
    { label: 'Pendientes', value: activeToday.filter((item) => item.status === 'pending').length, color: '#A16207', background: '#FEF3C7', icon: 'time' },
    { label: 'Confirmadas', value: activeToday.filter((item) => item.status === 'confirmed').length, color: palette.primary, background: '#FCE7F3', icon: 'checkmark-circle' },
    { label: 'Completadas', value: completed.length, color: '#047857', background: '#D1FAE5', icon: 'checkmark-done-circle' },
  ];

  return { shortcuts, identity, signOut, refresh, refreshing, now, today, activeToday, completed, next, recent, metrics };
}
