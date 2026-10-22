import { useCallback, useEffect, useState } from 'react';

import { getClientErrorMessage } from '@/features/client/components/client-appointment-helpers';
import type { ClientNotification, ClientNotificationPreferences } from '@/features/client/models/client-notification';
import { clientApiService } from '@/features/client/services/client-api-service';

export function useClientNotificationsViewModel() {
  const [notifications, setNotifications] = useState<ClientNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError('');
    try { setNotifications((await clientApiService.getNotifications()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())); }
    catch (loadError) { setError(getClientErrorMessage(loadError, 'No se pudieron cargar las notificaciones.')); }
    finally { setIsLoading(false); setIsRefreshing(false); }
  }, []);
  useEffect(() => {
    const request = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(request);
  }, [load]);
  return { error, isLoading, isRefreshing, notifications, refresh: () => load(true), retry: () => load(false) };
}

export function useClientNotificationPreferencesViewModel() {
  const [preferences, setPreferences] = useState<ClientNotificationPreferences>({ appointmentChanges: true, appointmentReminders: true, promotions: false });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const load = useCallback(async () => {
    setIsLoading(true); setError('');
    try { setPreferences((await clientApiService.getNotificationSettings()).preferences); }
    catch (loadError) { setError(getClientErrorMessage(loadError, 'No se pudieron cargar tus preferencias.')); }
    finally { setIsLoading(false); }
  }, []);
  useEffect(() => {
    const request = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(request);
  }, [load]);
  const save = useCallback(async () => {
    if (isSaving) return false;
    setIsSaving(true); setError(''); setMessage('');
    try { const result = await clientApiService.updateNotificationPreferences(preferences); setPreferences(result.preferences); setMessage(result.message || 'Preferencias guardadas.'); return true; }
    catch (saveError) { setError(getClientErrorMessage(saveError, 'No se pudieron guardar las preferencias.')); return false; }
    finally { setIsSaving(false); }
  }, [isSaving, preferences]);
  return { error, isLoading, isSaving, message, preferences, retry: load, save, setPreference: (key: keyof ClientNotificationPreferences, value: boolean) => { setPreferences((current) => ({ ...current, [key]: value })); setMessage(''); } };
}
