import { useMemo, useState } from 'react';
import { inPeriod, type AppointmentPeriod, type AppointmentStatus, type StylistAppointment } from '../models/stylist';
import { useStylist } from '../view-models/stylist-provider';

const filters: { label: string; value: AppointmentStatus | 'all'; }[] = [
  { label: 'Todas', value: 'all' }, { label: 'Pendientes', value: 'pending' },
  { label: 'Confirmadas', value: 'confirmed' }, { label: 'Completadas', value: 'completed' },
  { label: 'Canceladas', value: 'cancelled' },
];

const periods: { label: string; value: AppointmentPeriod; }[] = [
  { label: 'Hoy', value: 'today' }, { label: 'Esta semana', value: 'week' },
  { label: 'Este mes', value: 'month' }, { label: 'Todas las fechas', value: 'all' },
];

export function useStylistAppointmentsViewModel() {

  const { appointments, updateStatus, refresh, lastUpdated, busy, refreshing } = useStylist();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<AppointmentStatus | 'all'>('all');
  const [period, setPeriod] = useState<AppointmentPeriod>('week');
  const [periodOpen, setPeriodOpen] = useState(false);
  const [action, setAction] = useState<{ appointment: StylistAppointment; status: AppointmentStatus; } | null>(null);
  const [feedback, setFeedback] = useState('');
  const [actionError, setActionError] = useState('');
  async function performAction() {
    if (!action || busy) return;
    setActionError('');
    try {
      await updateStatus(action.appointment.id, action.status);
      setFeedback(action.status === 'confirmed' ? 'Cita confirmada.' : 'Servicio completado.');
      setAction(null);
    } catch (error) { setActionError(error instanceof Error ? error.message : 'No se pudo actualizar la cita.'); }
  }
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('es-MX');
    return appointments.filter((item) => inPeriod(item, period) && (status === 'all' || item.status === status) &&
      `${item.client} ${item.service}`.toLocaleLowerCase('es-MX').includes(query))
      .sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`));
  }, [appointments, period, search, status]);

  return { filters, periods, refresh, lastUpdated, busy, refreshing, search, setSearch, status, setStatus, period, setPeriod, periodOpen, setPeriodOpen, action, setAction, feedback, actionError, setActionError, performAction, filtered };
}
