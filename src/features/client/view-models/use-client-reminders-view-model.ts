import { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking } from 'react-native';

import { getClientErrorMessage, isUpcomingAppointment } from '@/features/client/components/client-appointment-helpers';
import type { ClientAppointment } from '@/features/client/models/client-appointment';
import type { ClientNotificationChannel, ClientReminderAdvance, ClientReminderSettings } from '@/features/client/models/client-notification';
import { clientApiService } from '@/features/client/services/client-api-service';

export function useClientRemindersViewModel() {
  const [appointments, setAppointments] = useState<ClientAppointment[]>([]);
  const [settings, setSettings] = useState<ClientReminderSettings>({ advance: '24 horas antes', channel: 'Email' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true); setError('');
    try {
      const [appointmentItems, notificationSettings] = await Promise.all([clientApiService.getAppointments(), clientApiService.getNotificationSettings()]);
      setAppointments(appointmentItems.filter(isUpcomingAppointment).sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()));
      setSettings(notificationSettings.reminder);
    } catch (loadError) { setError(getClientErrorMessage(loadError, 'No se pudieron cargar los recordatorios.')); }
    finally { setIsLoading(false); }
  }, []);
  useEffect(() => {
    const request = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(request);
  }, [load]);

  const save = useCallback(async () => {
    if (isSaving) return false;
    setIsSaving(true); setError(''); setMessage('');
    try { const result = await clientApiService.updateReminderSettings(settings); setSettings(result.reminder); setMessage(result.message || 'Recordatorio actualizado.'); return true; }
    catch (saveError) { setError(getClientErrorMessage(saveError, 'No se pudo guardar el recordatorio.')); return false; }
    finally { setIsSaving(false); }
  }, [isSaving, settings]);

  return {
    appointments, error, isLoading, isSaving, message, retry: load, save, settings,
    setAdvance: (advance: ClientReminderAdvance) => { setSettings((current) => ({ ...current, advance })); setMessage(''); },
    setChannel: (channel: ClientNotificationChannel) => { setSettings((current) => ({ ...current, channel })); setMessage(''); },
  };
}

export function useClientShareReminderViewModel(initialAppointmentId = '') {
  const [appointments, setAppointments] = useState<ClientAppointment[]>([]);
  const [appointmentId, setAppointmentId] = useState(initialAppointmentId);
  const [message, setMessage] = useState('Hola, te comparto el recordatorio de mi próxima cita en Estética Panamericana.');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true); setError('');
    try {
      const items = (await clientApiService.getAppointments()).filter(isUpcomingAppointment).sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
      setAppointments(items);
      setAppointmentId((current) => items.some((item) => item.id === current) ? current : items[0]?.id || '');
    } catch (loadError) { setError(getClientErrorMessage(loadError, 'No se pudieron cargar tus citas.')); }
    finally { setIsLoading(false); }
  }, []);
  useEffect(() => {
    const request = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(request);
  }, [load]);
  const selectedAppointment = useMemo(() => appointments.find((item) => item.id === appointmentId), [appointmentId, appointments]);

  const prepare = useCallback(async () => {
    if (!selectedAppointment || !message.trim() || isSubmitting) return false;
    setIsSubmitting(true); setSubmitError(''); setSuccessMessage('');
    try {
      const result = await clientApiService.prepareNotification({ appointmentId: selectedAppointment.id, message: message.trim() });
      if (result.notification.whatsappUrl) {
        if (!await Linking.canOpenURL(result.notification.whatsappUrl)) { setSubmitError('No hay una aplicación compatible para abrir WhatsApp.'); return false; }
        await Linking.openURL(result.notification.whatsappUrl);
      } else {
        setSuccessMessage(result.message || 'Recordatorio procesado correctamente.');
      }
      return true;
    } catch (prepareError) { setSubmitError(getClientErrorMessage(prepareError, 'No se pudo preparar el recordatorio.')); return false; }
    finally { setIsSubmitting(false); }
  }, [isSubmitting, message, selectedAppointment]);

  return { appointmentId, appointments, error, isLoading, isSubmitting, message, prepare, retry: load, selectedAppointment, setAppointmentId, setMessage, submitError, successMessage };
}
