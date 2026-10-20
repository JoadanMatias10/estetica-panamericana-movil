import { useMemo, useState } from 'react';
import { addDays, formatDate, inPeriod, startOfWeek, type AppointmentPeriod } from '../models/stylist';
import { useStylist } from '../view-models/stylist-provider';

const periods: { value: AppointmentPeriod; label: string; }[] = [
  { value: 'month', label: 'Este mes' },
  { value: 'week', label: 'Esta semana' },
  { value: 'today', label: 'Hoy' },
  { value: 'all', label: 'Todo el historial' },
];

const chartColors = ['#8338EC', '#EC4899', '#059669'];

function normalizeSearch(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-MX').trim();
}

function periodDescription(period: AppointmentPeriod, reference: Date) {
  if (period === 'all') return 'Todo el historial';
  if (period === 'today') return `Hoy · ${formatDate(reference, { day: 'numeric', month: 'short' })}`;
  if (period === 'month') return `Este mes · ${formatDate(reference, { month: 'long', year: 'numeric' })}`;
  const first = startOfWeek(reference);
  return `Esta semana · ${formatDate(first, { day: 'numeric', month: 'short' })} – ${formatDate(addDays(first, 6), { day: 'numeric', month: 'short' })}`;
}

export function useStylistServicesViewModel() {

  const { appointments, lastUpdated, refresh, refreshing } = useStylist();
  const [period, setPeriod] = useState<AppointmentPeriod>('month');
  const [service, setService] = useState('');
  const [query, setQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const reference = new Date(lastUpdated);
  const completed = useMemo(() => appointments
    .filter((appointment) => appointment.status === 'completed' && inPeriod(appointment, period, new Date(lastUpdated)))
    .sort((first, second) => `${second.date} ${second.start}`.localeCompare(`${first.date} ${first.start}`)),
    [appointments, period, lastUpdated]);
  const statistics = useMemo(() => {
    const counts = new Map<string, number>();
    completed.forEach((appointment) => counts.set(appointment.service, (counts.get(appointment.service) ?? 0) + 1));
    return Array.from(counts, ([name, count]) => ({ name, count }))
      .sort((first, second) => second.count - first.count || first.name.localeCompare(second.name, 'es-MX'));
  }, [completed]);
  const services = useMemo(() => Array.from(new Set(appointments
    .filter((appointment) => appointment.status === 'completed').map((appointment) => appointment.service)))
    .sort((first, second) => first.localeCompare(second, 'es-MX')), [appointments]);
  const search = normalizeSearch(query);
  const history = completed.filter((appointment) => (!service || appointment.service === service) &&
    (!search || normalizeSearch(`${appointment.client} ${appointment.service}`).includes(search)));
  const clients = new Set(completed.map((appointment) => (appointment.email || appointment.phone || appointment.client).trim().toLocaleLowerCase('es-MX'))).size;
  const topService = statistics[0];
  const updatedTime = formatDate(reference, { hour: '2-digit', minute: '2-digit' });

  function resetFilters() {
    setPeriod('all');
    setService('');
    setQuery('');
  }

  return { periods, chartColors, periodDescription, refresh, refreshing, period, setPeriod, service, setService, query, setQuery, filtersOpen, setFiltersOpen, reference, completed, statistics, services, history, clients, topService, updatedTime, resetFilters };
}
