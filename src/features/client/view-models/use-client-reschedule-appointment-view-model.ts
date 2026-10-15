import { useCallback, useEffect, useMemo, useState } from 'react';

import type { ClientAppointment } from '@/features/client/models/client-appointment';
import type { ClientAvailabilityDay, ClientStylist } from '@/features/client/models/client-stylist';
import { clientApiService } from '@/features/client/services/client-api-service';
import {
  addDaysToDateKey,
  canModifyAppointment,
  getClientErrorMessage,
  todayDateKey,
} from '@/features/client/components/client-appointment-helpers';

export function useClientRescheduleAppointmentViewModel(appointmentId: string) {
  const [appointment, setAppointment] = useState<ClientAppointment>();
  const [stylists, setStylists] = useState<ClientStylist[]>([]);
  const [selectedStylistId, setSelectedStylistId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [days, setDays] = useState<ClientAvailabilityDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitError, setSubmitError] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [appointmentItems, stylistItems] = await Promise.all([
        clientApiService.getAppointments(),
        clientApiService.getStylists(),
      ]);
      const current = appointmentItems.find((item) => item.id === appointmentId);
      if (!current) throw new Error('La cita solicitada no existe.');
      if (!canModifyAppointment(current)) throw new Error('Esta cita ya no se puede reprogramar.');
      setAppointment(current);
      setStylists(stylistItems);
      setSelectedStylistId(current.stylistId || stylistItems[0]?.id || '');
    } catch (loadError) {
      setError(getClientErrorMessage(loadError, 'No se pudo cargar la cita.'));
    } finally {
      setIsLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    const request = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(request);
  }, [load]);

  const loadAvailability = useCallback(async () => {
    if (!appointment || !selectedStylistId) return;
    setIsLoadingAvailability(true);
    setSubmitError('');
    const fromDate = todayDateKey();
    try {
      const result = await clientApiService.getStylistAvailability({
        fromDate,
        serviceId: appointment.serviceId || undefined,
        stylistId: selectedStylistId,
        toDate: addDaysToDateKey(fromDate, 20),
      });
      setDays(result.days);
      setSelectedDate((current) =>
        result.days.some((day) => day.date === current && day.slots.length)
          ? current
          : result.days.find((day) => day.slots.length)?.date ?? '');
      setSelectedTime('');
    } catch (loadError) {
      setDays([]);
      setSubmitError(getClientErrorMessage(loadError, 'No se pudo consultar la disponibilidad.'));
    } finally {
      setIsLoadingAvailability(false);
    }
  }, [appointment, selectedStylistId]);

  useEffect(() => {
    const request = setTimeout(() => { void loadAvailability(); }, 0);
    return () => clearTimeout(request);
  }, [loadAvailability]);

  const selectedDay = useMemo(
    () => days.find((day) => day.date === selectedDate),
    [days, selectedDate],
  );
  const selectedStylist = useMemo(
    () => stylists.find((stylist) => stylist.id === selectedStylistId),
    [selectedStylistId, stylists],
  );

  const submit = useCallback(async () => {
    if (isSubmitting || !appointment) return null;
    if (!selectedStylistId || !selectedDate || !selectedTime || !selectedDay?.slots.includes(selectedTime)) {
      setSubmitError('Selecciona un nuevo horario disponible.');
      return null;
    }
    setIsSubmitting(true);
    setSubmitError('');
    try {
      return await clientApiService.reprogramAppointment(appointment.id, {
        date: selectedDate,
        stylistId: selectedStylistId,
        time: selectedTime,
      });
    } catch (submitFailure) {
      setSubmitError(getClientErrorMessage(submitFailure, 'No se pudo reprogramar la cita.'));
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [appointment, isSubmitting, selectedDate, selectedDay?.slots, selectedStylistId, selectedTime]);

  return {
    appointment,
    canSubmit: Boolean(selectedDate && selectedTime && selectedStylistId),
    days,
    error,
    isLoading,
    isLoadingAvailability,
    isSubmitting,
    retry: load,
    retryAvailability: loadAvailability,
    selectedDate,
    selectedDay,
    selectedStylist,
    selectedStylistId,
    selectedTime,
    selectDate: (date: string) => { setSelectedDate(date); setSelectedTime(''); setSubmitError(''); },
    selectStylist: (stylistId: string) => { setSelectedStylistId(stylistId); setSelectedDate(''); setSelectedTime(''); },
    selectTime: (time: string) => { setSelectedTime(time); setSubmitError(''); },
    stylists,
    submit,
    submitError,
  };
}
