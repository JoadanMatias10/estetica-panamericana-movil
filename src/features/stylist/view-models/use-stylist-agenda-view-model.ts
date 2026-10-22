import { useMemo, useState } from 'react';
import { dayAgenda } from '../models/availability';
import { addDays, dateKey, formatDate, startOfWeek } from '../models/stylist';
import { useStylist } from '../view-models/stylist-provider';

type CalendarMode = 'day' | 'week' | 'month';

const weekdayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export function useStylistAgendaViewModel() {

  const { appointments, workDays, blocks, refresh, refreshing } = useStylist();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [mode, setMode] = useState<CalendarMode>('week');
  const selectedKey = dateKey(selectedDate);
  const weekStart = startOfWeek(selectedDate);
  const agenda = useMemo(() => dayAgenda(selectedKey, workDays, blocks, appointments), [selectedKey, workDays, blocks, appointments]);
  const counts = useMemo(() => {
    const result = new Map<string, number>();
    appointments.filter((appointment) => appointment.status !== 'cancelled').forEach((appointment) => result.set(appointment.date, (result.get(appointment.date) ?? 0) + 1));
    return result;
  }, [appointments]);
  const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1, 12);
  const monthGridStart = startOfWeek(monthStart);
  const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 12);
  const monthCells = Math.ceil((((monthStart.getDay() + 6) % 7) + monthEnd.getDate()) / 7) * 7;
  const dates = mode === 'month'
    ? Array.from({ length: monthCells }, (_, index) => addDays(monthGridStart, index))
    : mode === 'week' ? Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)) : [selectedDate];
  const periodLabel = mode === 'month'
    ? formatDate(selectedDate, { month: 'long', year: 'numeric' })
    : mode === 'day' ? formatDate(selectedDate, { weekday: 'long', day: 'numeric', month: 'short' })
      : `${formatDate(weekStart, { day: 'numeric', month: 'short' })} – ${formatDate(addDays(weekStart, 6), { day: 'numeric', month: 'short' })}`;

  function movePeriod(direction: number) {
    if (mode === 'month') {
      const next = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + direction, 1, 12);
      next.setDate(Math.min(selectedDate.getDate(), new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
      setSelectedDate(next);
    } else setSelectedDate(addDays(selectedDate, direction * (mode === 'week' ? 7 : 1)));
  }

  const estimated = agenda.appointments.some((appointment) => appointment.durationEstimated && appointment.status !== 'cancelled');
  return { weekdayNames, refresh, refreshing, estimated, selectedDate, setSelectedDate, mode, setMode, selectedKey, agenda, counts, dates, periodLabel, movePeriod };
}
