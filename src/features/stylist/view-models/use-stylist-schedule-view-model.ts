import { useMemo, useState } from 'react';
import { availabilityConflict, blockValidation, clockMinutes } from '../models/availability';
import { addDays, dateKey, formatDate, inPeriod, startOfWeek, validateAvailability, type ScheduleBlock, type WorkDay } from '../models/stylist';
import { useStylist } from '../view-models/stylist-provider';

export function useStylistScheduleViewModel() {

  const { appointments, workDays, blocks, interval, saveAvailability, busy, refresh, refreshing } = useStylist();
  const [week, setWeek] = useState(() => startOfWeek(new Date()));
  const [editedDays, setDraftDays] = useState<WorkDay[] | null>(null);
  const draftDays = editedDays ?? workDays;
  const [editedBlocks, setDraftBlocks] = useState<ScheduleBlock[] | null>(null);
  const draftBlocks = editedBlocks ?? blocks;
  const [editedInterval, setDraftInterval] = useState<number | null>(null);
  const draftInterval = editedInterval ?? interval;
  const [expanded, setExpanded] = useState<number | null>(null);
  const [showAllBlocks, setShowAllBlocks] = useState(false);
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [blockDate, setBlockDate] = useState(() => dateKey(new Date()));
  const [blockStart, setBlockStart] = useState('13:00');
  const [blockEnd, setBlockEnd] = useState('16:00');
  const [blockReason, setBlockReason] = useState('');
  const [blockError, setBlockError] = useState('');
  const [message, setMessage] = useState<{ text: string; error: boolean; } | null>(null);
  const weekAppointments = useMemo(() => appointments.filter((appointment) => inPeriod(appointment, 'week', week)), [appointments, week]);
  const affected = useMemo(() => appointments.filter((appointment) =>
    (appointment.status === 'pending' || appointment.status === 'confirmed') && appointment.date >= dateKey(new Date()) &&
    availabilityConflict(appointment, draftDays, draftBlocks)), [appointments, draftDays, draftBlocks]);
  const dirty = JSON.stringify({ days: draftDays, blocks: draftBlocks, interval: draftInterval }) !== JSON.stringify({ days: workDays, blocks, interval });
  const sortedBlocks = [...draftBlocks].sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start));
  const visibleBlocks = showAllBlocks ? sortedBlocks : sortedBlocks.slice(0, 2);
  const weekLabel = `${formatDate(week, { day: 'numeric', month: 'short' })} – ${formatDate(addDays(week, 6), { day: 'numeric', month: 'short' })}`;

  function changeDay(weekday: number, change: Partial<WorkDay>) {
    setDraftDays((days) => (days ?? workDays).map((day) => day.weekday === weekday ? { ...day, ...change } : day));
    setMessage(null);
  }

  function addBlock() {
    const block: ScheduleBlock = { id: `block-${Date.now()}`, date: blockDate.trim(), start: blockStart.trim(), end: blockEnd.trim(), reason: blockReason.trim() };
    const error = blockValidation(block);
    if (error) return setBlockError(error);
    if (!block.reason) return setBlockError('Escribe un motivo para identificar el bloqueo.');
    if (draftBlocks.some((item) => item.date === block.date && clockMinutes(item.start) < clockMinutes(block.end) && clockMinutes(block.start) < clockMinutes(item.end))) {
      return setBlockError('Este periodo se superpone con otro bloqueo de la misma fecha.');
    }
    setDraftBlocks((current) => [...(current ?? blocks), block]);
    setShowBlockForm(false);
    setBlockReason('');
    setBlockError('');
    setShowAllBlocks(true);
    setMessage(null);
  }

  async function save() {
    if (busy) return;
    const errors = validateAvailability(draftDays, draftBlocks, draftInterval);
    if (errors.length) return setMessage({ text: errors[0], error: true });
    try {
      await saveAvailability(draftDays, draftBlocks, draftInterval);
      setDraftDays(null); setDraftBlocks(null); setDraftInterval(null);
      setMessage({ text: 'Disponibilidad guardada correctamente. La agenda ya refleja tus cambios.', error: false });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'No fue posible guardar la disponibilidad.', error: true });
    }
  }

  return { refresh, refreshing, blocks, busy, week, setWeek, draftDays, setDraftBlocks, draftBlocks, setDraftInterval, draftInterval, expanded, setExpanded, showAllBlocks, setShowAllBlocks, showBlockForm, setShowBlockForm, blockDate, setBlockDate, blockStart, setBlockStart, blockEnd, setBlockEnd, blockReason, setBlockReason, blockError, setBlockError, message, setMessage, weekAppointments, affected, dirty, visibleBlocks, weekLabel, changeDay, addBlock, save };
}
