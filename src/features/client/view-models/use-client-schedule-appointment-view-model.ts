import { useCallback, useEffect, useMemo, useState } from 'react';

import type { ClientAvailabilityDay, ClientStylist } from '@/features/client/models/client-stylist';
import { clientApiService } from '@/features/client/services/client-api-service';
import type { PublicService, ServiceCategory } from '@/features/public/models/public-service';
import { getServicesCatalog } from '@/features/public/services/public-api-service';
import {
  addDaysToDateKey,
  getClientErrorMessage,
  todayDateKey,
} from '@/features/client/components/client-appointment-helpers';

export type ClientScheduleInitialSelection = {
  date?: string;
  serviceId?: string;
  stylistId?: string;
  time?: string;
};

export type ClientAppointmentTimePeriod = 'all' | 'morning' | 'afternoon';

function normalizeFilterText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es-MX')
    .trim();
}

export function useClientScheduleAppointmentViewModel(initial: ClientScheduleInitialSelection = {}) {
  const [services, setServices] = useState<PublicService[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [stylists, setStylists] = useState<ClientStylist[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState(initial.serviceId ?? '');
  const [selectedStylistId, setSelectedStylistId] = useState(initial.stylistId ?? '');
  const [selectedDate, setSelectedDate] = useState(initial.date ?? '');
  const [selectedTime, setSelectedTime] = useState(initial.time ?? '');
  const [serviceQuery, setServiceQuery] = useState('');
  const [stylistQuery, setStylistQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<ClientAppointmentTimePeriod>('all');
  const [isServicePickerOpen, setIsServicePickerOpen] = useState(!initial.serviceId);
  const [notes, setNotes] = useState('');
  const [days, setDays] = useState<ClientAvailabilityDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [availabilityError, setAvailabilityError] = useState('');
  const [submitError, setSubmitError] = useState('');

  const loadOptions = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [catalog, stylistItems] = await Promise.all([
        getServicesCatalog(),
        clientApiService.getStylists(),
      ]);
      setServices(catalog.services);
      setCategories(catalog.categories);
      setStylists(stylistItems);
      setSelectedServiceId((current) => current || initial.serviceId || '');
      setSelectedStylistId((current) => current || initial.stylistId || '');
    } catch (loadError) {
      setError(getClientErrorMessage(loadError, 'No fue posible preparar el agendamiento.'));
    } finally {
      setIsLoading(false);
    }
  }, [initial.serviceId, initial.stylistId]);

  useEffect(() => {
    const request = setTimeout(() => { void loadOptions(); }, 0);
    return () => clearTimeout(request);
  }, [loadOptions]);

  const loadAvailability = useCallback(async () => {
    if (!selectedServiceId || !selectedStylistId) {
      setDays([]);
      setAvailabilityError('');
      return;
    }
    setIsLoadingAvailability(true);
    setAvailabilityError('');
    const fromDate = todayDateKey();
    try {
      const result = await clientApiService.getStylistAvailability({
        fromDate,
        serviceId: selectedServiceId,
        stylistId: selectedStylistId,
        toDate: addDaysToDateKey(fromDate, 13),
      });
      setDays(result.days);
      setSelectedDate((current) => {
        if (result.days.some((day) => day.date === current && day.slots.length)) return current;
        if (initial.date && result.days.some((day) => day.date === initial.date && day.slots.length)) {
          return initial.date;
        }
        return result.days.find((day) => day.slots.length)?.date ?? '';
      });
      setSelectedTime((current) => {
        if (!current && initial.time) return initial.time;
        return current;
      });
    } catch (loadError) {
      setDays([]);
      setAvailabilityError(getClientErrorMessage(loadError, 'No se pudo consultar la disponibilidad.'));
    } finally {
      setIsLoadingAvailability(false);
    }
  }, [initial.date, initial.time, selectedServiceId, selectedStylistId]);

  useEffect(() => {
    const request = setTimeout(() => { void loadAvailability(); }, 0);
    return () => clearTimeout(request);
  }, [loadAvailability]);

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId),
    [selectedServiceId, services],
  );
  const selectedStylist = useMemo(
    () => stylists.find((stylist) => stylist.id === selectedStylistId),
    [selectedStylistId, stylists],
  );
  const selectedDay = useMemo(
    () => days.find((day) => day.date === selectedDate),
    [days, selectedDate],
  );
  const filteredServices = useMemo(() => {
    const query = normalizeFilterText(serviceQuery);
    return services.filter((service) => {
      if (selectedCategoryId !== 'all' && service.categoryId !== selectedCategoryId) return false;
      if (!query) return true;
      return normalizeFilterText(`${service.name} ${service.segment} ${service.subcategory}`).includes(query);
    });
  }, [selectedCategoryId, serviceQuery, services]);
  const filteredStylists = useMemo(() => {
    const query = normalizeFilterText(stylistQuery);
    if (!query) return stylists;
    return stylists.filter((stylist) => normalizeFilterText(stylist.name).includes(query));
  }, [stylistQuery, stylists]);
  const visibleTimes = useMemo(() => {
    const slots = selectedDay?.slots ?? [];
    if (selectedTimePeriod === 'all') return slots;
    return slots.filter((slot) => {
      const hour = Number(slot.split(':')[0]);
      return selectedTimePeriod === 'morning' ? hour < 12 : hour >= 12;
    });
  }, [selectedDay?.slots, selectedTimePeriod]);

  const selectService = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    setIsServicePickerOpen(false);
    setSelectedDate('');
    setSelectedTime('');
    setSelectedTimePeriod('all');
    setSubmitError('');
  };
  const selectStylist = (stylistId: string) => {
    setSelectedStylistId(stylistId);
    setSelectedDate('');
    setSelectedTime('');
    setSelectedTimePeriod('all');
    setSubmitError('');
  };
  const selectDate = (date: string) => {
    setSelectedDate(date);
    setSelectedTime('');
    setSelectedTimePeriod('all');
    setSubmitError('');
  };

  const submit = useCallback(async () => {
    if (isSubmitting) return null;
    if (!selectedService || !selectedStylist || !selectedDate || !selectedTime) {
      setSubmitError('Selecciona servicio, estilista, fecha y horario.');
      return null;
    }
    if (!(selectedDay?.slots.includes(selectedTime))) {
      setSubmitError('El horario seleccionado ya no está disponible.');
      return null;
    }
    setIsSubmitting(true);
    setSubmitError('');
    try {
      return await clientApiService.createAppointment({
        date: selectedDate,
        notes,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        stylistId: selectedStylist.id,
        time: selectedTime,
      });
    } catch (submitFailure) {
      setSubmitError(getClientErrorMessage(submitFailure, 'No se pudo agendar la cita.'));
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, notes, selectedDate, selectedDay?.slots, selectedService, selectedStylist, selectedTime]);

  return {
    availabilityError,
    canSubmit: Boolean(selectedService && selectedStylist && selectedDate && selectedTime),
    categories,
    days,
    error,
    isLoading,
    isLoadingAvailability,
    isServicePickerOpen,
    isSubmitting,
    notes,
    retry: loadOptions,
    retryAvailability: loadAvailability,
    selectedDate,
    selectedDay,
    selectedCategoryId,
    selectedService,
    selectedServiceId,
    selectedStylist,
    selectedStylistId,
    selectedTime,
    selectedTimePeriod,
    serviceQuery,
    selectDate,
    selectCategory: setSelectedCategoryId,
    selectService,
    selectStylist,
    selectTime: (time: string) => { setSelectedTime(time); setSubmitError(''); },
    selectTimePeriod: setSelectedTimePeriod,
    filteredServices,
    filteredStylists,
    openServicePicker: () => setIsServicePickerOpen(true),
    services,
    setServiceQuery,
    setNotes,
    setStylistQuery,
    stylists,
    stylistQuery,
    submit,
    submitError,
    visibleTimes,
  };
}
