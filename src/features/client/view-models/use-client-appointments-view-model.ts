import { useCallback, useEffect, useMemo, useState } from 'react';

import type { ClientAppointment } from '@/features/client/models/client-appointment';
import { clientApiService } from '@/features/client/services/client-api-service';
import {
  getClientErrorMessage,
  isUpcomingAppointment,
} from '@/features/client/components/client-appointment-helpers';

export type ClientAppointmentsSection = 'upcoming' | 'history';

export function useClientAppointmentsViewModel() {
  const [appointments, setAppointments] = useState<ClientAppointment[]>([]);
  const [section, setSection] = useState<ClientAppointmentsSection>('upcoming');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [busyAppointmentId, setBusyAppointmentId] = useState('');
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const load = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError('');
    try {
      setAppointments(await clientApiService.getAppointments());
    } catch (loadError) {
      setError(getClientErrorMessage(loadError, 'No se pudieron cargar tus citas.'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const request = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(request);
  }, [load]);

  const upcoming = useMemo(
    () => appointments
      .filter(isUpcomingAppointment)
      .sort((left, right) => new Date(left.dateTime).getTime() - new Date(right.dateTime).getTime()),
    [appointments],
  );

  const history = useMemo(
    () => appointments
      .filter((appointment) => !isUpcomingAppointment(appointment))
      .sort((left, right) => new Date(right.dateTime).getTime() - new Date(left.dateTime).getTime()),
    [appointments],
  );

  const cancelAppointment = useCallback(async (appointmentId: string) => {
    if (busyAppointmentId) return false;
    setBusyAppointmentId(appointmentId);
    setActionError('');
    try {
      const result = await clientApiService.cancelAppointment(appointmentId);
      setAppointments((current) => current.map((appointment) =>
        appointment.id === result.appointment.id ? result.appointment : appointment));
      return true;
    } catch (cancelError) {
      setActionError(getClientErrorMessage(cancelError, 'No se pudo cancelar la cita.'));
      return false;
    } finally {
      setBusyAppointmentId('');
    }
  }, [busyAppointmentId]);

  return {
    actionError,
    appointments: section === 'upcoming' ? upcoming : history,
    busyAppointmentId,
    cancelAppointment,
    clearActionError: () => setActionError(''),
    error,
    historyCount: history.length,
    isLoading,
    isRefreshing,
    refresh: () => load(true),
    retry: () => load(false),
    section,
    setSection,
    upcomingCount: upcoming.length,
  };
}
