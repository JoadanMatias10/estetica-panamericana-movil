import { createContext, useCallback, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';

import { clearPublicAuthSession, getActivePublicAuthSession, getPublicAuthSession, subscribePublicAuthSession } from '@/features/public/auth/services/public-auth-session';
import {
  canUpdateStatus,
  type AppointmentStatus,
  type ScheduleBlock,
  type WorkDay,
} from '@/features/stylist/models/stylist';
import { StylistApiError, stylistApiService } from '../services/stylist-api-service';
import { getNotificationsReadAt, saveNotificationsReadAt } from '../services/stylist-notification-store';

type Snapshot = Awaited<ReturnType<typeof stylistApiService.getSnapshot>>;
const emptyAppointments: Snapshot['appointments'] = [];
const emptyDays: WorkDay[] = [];
const emptyBlocks: ScheduleBlock[] = [];

function useStylistState() {
  const [data, setData] = useState<Snapshot>();
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [readAt, setReadAt] = useState('');
  const owner = useRef('');
  const revision = useRef(0);
  const requestId = useRef(0);
  const mutation = useRef(false);
  const handleAuthError = useCallback(async (failure: unknown, expectedOwner: string) => {
    if (owner.current === expectedOwner && failure instanceof StylistApiError && (failure.status === 401 || failure.status === 403)) await clearPublicAuthSession();
  }, []);
  const refresh = useCallback(async () => {
    const currentOwner = owner.current;
    if (!currentOwner || mutation.current) return;
    const currentRequest = ++requestId.current;
    const currentRevision = revision.current;
    setRefreshing(true);
    setError('');
    try {
      const result = await stylistApiService.getSnapshot();
      if (owner.current === currentOwner && currentRequest === requestId.current && revision.current === currentRevision) {
        setData(result);
        setLastUpdated(new Date().toISOString());
      }
    } catch (failure) {
      if (owner.current === currentOwner && currentRequest === requestId.current) {
        setError(failure instanceof Error ? failure.message : 'No fue posible cargar tus datos.');
        await handleAuthError(failure, currentOwner);
      }
    } finally {
      if (owner.current === currentOwner && currentRequest === requestId.current) setRefreshing(false);
    }
  }, [handleAuthError]);

  useEffect(() => {
    let alive = true;
    const sync = () => {
      if (!alive) return;
      const session = getActivePublicAuthSession();
      const key = session?.user.role === 'stylist' ? `${session.user.id}:${session.token}` : '';
      setCheckingSession(false);
      setHasSession(Boolean(key));
      if (key === owner.current) return;
      owner.current = key;
      requestId.current += 1;
      revision.current += 1;
      mutation.current = false;
      setBusy(false); setData(undefined); setError(''); setLastUpdated(''); setReadAt(''); setRefreshing(false);
      if (key && session) {
        void getNotificationsReadAt(session.user.id).then((value) => {
          if (alive && owner.current === key) setReadAt((current) => current > value ? current : value);
        });
        void refresh();
      }
    };
    const unsubscribe = subscribePublicAuthSession(sync);
    void getPublicAuthSession().then(sync);
    return () => { alive = false; unsubscribe(); owner.current = ''; requestId.current += 1; };
  }, [refresh]);

  const updateStatus = useCallback(async (id: string, status: AppointmentStatus) => {
    const appointment = data?.appointments.find((item) => item.id === id);
    if (!appointment || !canUpdateStatus(appointment.status, status)) throw new Error('Esta cita ya no permite esa acción. Actualiza la información.');
    if (mutation.current) throw new Error('Espera a que termine la operación actual.');
    mutation.current = true; setBusy(true);
    const currentOwner = owner.current;
    revision.current += 1;
    try {
      const updated = await stylistApiService.updateStatus(id, status, data!.interval);
      if (owner.current !== currentOwner) throw new Error('La sesión cambió. Inicia sesión nuevamente.');
      setData((current) => current ? { ...current, appointments: current.appointments.map((item) => item.id === id ? updated : item) } : current);
      setLastUpdated(new Date().toISOString());
    } catch (failure) { await handleAuthError(failure, currentOwner); throw failure; }
    finally { if (owner.current === currentOwner) { mutation.current = false; setBusy(false); } }
  }, [data, handleAuthError]);

  const saveAvailability = useCallback(async (days: WorkDay[], blocks: ScheduleBlock[], interval: number) => {
    if (mutation.current) throw new Error('Espera a que termine la operación actual.');
    mutation.current = true; setBusy(true);
    const currentOwner = owner.current;
    revision.current += 1;
    try {
      const result = await stylistApiService.saveAvailability(days, blocks, interval);
      if (owner.current !== currentOwner) throw new Error('La sesión cambió. Inicia sesión nuevamente.');
      setData((current) => current ? {
        ...current, ...result,
        appointments: current.appointments.map((item) => item.durationEstimated ? { ...item, duration: result.interval } : item),
      } : current);
      setLastUpdated(new Date().toISOString());
      return result;
    } catch (failure) { await handleAuthError(failure, currentOwner); throw failure; }
    finally { if (owner.current === currentOwner) { mutation.current = false; setBusy(false); } }
  }, [handleAuthError]);
  const markNotificationsRead = useCallback(() => {
    const session = getActivePublicAuthSession();
    if (session?.user.role !== 'stylist') return;
    const value = new Date().toISOString();
    setReadAt(value);
    void saveNotificationsReadAt(session.user.id, value);
  }, []);
  const signOut = useCallback(async () => { await clearPublicAuthSession(); }, []);
  const appointments = data?.appointments ?? emptyAppointments;
  const unreadCount = appointments.filter((item) => {
    const elapsed = new Date(lastUpdated).getTime() - new Date(item.updatedAt).getTime();
    return item.updatedAt > readAt && elapsed >= 0 && elapsed <= 86400000;
  }).length;
  return {
    appointments, workDays: data?.workDays ?? emptyDays, blocks: data?.blocks ?? emptyBlocks,
    interval: data?.interval ?? 30, identity: data?.identity, hasData: Boolean(data), checkingSession, hasSession,
    refreshing, busy, error, lastUpdated, notificationsRead: unreadCount === 0, unreadCount, readAt,
    updateStatus, saveAvailability, markNotificationsRead, refresh, signOut
  };
}

const StylistContext = createContext<ReturnType<typeof useStylistState> | null>(null);
export function StylistProvider({ children }: PropsWithChildren) {
  const state = useStylistState();
  return <StylistContext.Provider value={state}>{children}</StylistContext.Provider>;
}

export function useStylist() {
  const context = useContext(StylistContext);
  if (!context) throw new Error('Las pantallas de estilista deben estar dentro de StylistProvider.');
  return context;
}
