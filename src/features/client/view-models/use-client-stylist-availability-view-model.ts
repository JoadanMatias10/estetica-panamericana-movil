import { useCallback, useEffect, useMemo, useState } from 'react';

import type { ClientAvailabilityDay, ClientStylist } from '@/features/client/models/client-stylist';
import { clientApiService } from '@/features/client/services/client-api-service';
import {
  addDaysToDateKey,
  getClientErrorMessage,
  todayDateKey,
} from '@/features/client/components/client-appointment-helpers';

type InitialAvailabilitySelection = {
  date?: string;
  serviceId?: string;
  stylistId?: string;
  time?: string;
};

export function useClientStylistAvailabilityViewModel(initial: InitialAvailabilitySelection = {}) {
  const [stylists, setStylists] = useState<ClientStylist[]>([]);
  const [selectedStylistId, setSelectedStylistId] = useState(initial.stylistId ?? '');
  const [selectedDate, setSelectedDate] = useState(initial.date ?? '');
  const [selectedTime, setSelectedTime] = useState(initial.time ?? '');
  const [days, setDays] = useState<ClientAvailabilityDay[]>([]);
  const [isLoadingStylists, setIsLoadingStylists] = useState(true);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [error, setError] = useState('');

  const loadStylists = useCallback(async () => {
    setIsLoadingStylists(true);
    setError('');
    try {
      const items = await clientApiService.getStylists();
      setStylists(items);
      setSelectedStylistId((current) => current || items[0]?.id || '');
    } catch (loadError) {
      setError(getClientErrorMessage(loadError, 'No se pudieron cargar los estilistas.'));
    } finally {
      setIsLoadingStylists(false);
    }
  }, []);

  useEffect(() => {
    const request = setTimeout(() => { void loadStylists(); }, 0);
    return () => clearTimeout(request);
  }, [loadStylists]);

  const loadAvailability = useCallback(async () => {
    if (!selectedStylistId) {
      setDays([]);
      return;
    }
    setIsLoadingAvailability(true);
    setError('');
    const fromDate = todayDateKey();
    try {
      const result = await clientApiService.getStylistAvailability({
        fromDate,
        serviceId: initial.serviceId,
        stylistId: selectedStylistId,
        toDate: addDaysToDateKey(fromDate, 20),
      });
      setDays(result.days);
      setSelectedDate((current) => {
        if (result.days.some((day) => day.date === current && day.slots.length)) return current;
        if (initial.date && result.days.some((day) => day.date === initial.date && day.slots.length)) {
          return initial.date;
        }
        return result.days.find((day) => day.slots.length)?.date ?? '';
      });
      setSelectedTime((current) => current && result.days.some((day) => day.slots.includes(current))
        ? current
        : initial.time && result.days.some((day) => day.slots.includes(initial.time!))
          ? initial.time
          : '');
    } catch (loadError) {
      setDays([]);
      setError(getClientErrorMessage(loadError, 'No se pudo consultar la disponibilidad.'));
    } finally {
      setIsLoadingAvailability(false);
    }
  }, [initial.date, initial.serviceId, initial.time, selectedStylistId]);

  useEffect(() => {
    const request = setTimeout(() => { void loadAvailability(); }, 0);
    return () => clearTimeout(request);
  }, [loadAvailability]);

  const selectedDay = useMemo(
    () => days.find((day) => day.date === selectedDate),
    [days, selectedDate],
  );

  return {
    canContinue: Boolean(selectedStylistId && selectedDate && selectedTime),
    days,
    error,
    isLoading: isLoadingStylists,
    isLoadingAvailability,
    retry: selectedStylistId ? loadAvailability : loadStylists,
    selectedDate,
    selectedDay,
    selectedStylistId,
    selectedTime,
    selectDate: (date: string) => { setSelectedDate(date); setSelectedTime(''); },
    selectStylist: (stylistId: string) => { setSelectedStylistId(stylistId); setSelectedDate(''); setSelectedTime(''); },
    selectTime: setSelectedTime,
    stylists,
  };
}
