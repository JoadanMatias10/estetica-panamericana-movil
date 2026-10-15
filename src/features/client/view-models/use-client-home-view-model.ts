import { useCallback, useEffect, useMemo, useState } from 'react';

import { isUpcomingAppointment } from '@/features/client/components/client-appointment-helpers';
import type { ClientAppointment } from '@/features/client/models/client-appointment';
import type { ClientPayment } from '@/features/client/models/client-payment';
import type { ClientUser } from '@/features/client/models/client-user';
import { clientApiService } from '@/features/client/services/client-api-service';
import type { PublicHomeHighlights } from '@/features/public/models/public-content';
import { getHomeHighlights } from '@/features/public/services/public-api-service';

const emptyHighlights: PublicHomeHighlights = { products: [], promotions: [], services: [] };

export function useClientHomeViewModel() {
  const [user, setUser] = useState<ClientUser>();
  const [appointments, setAppointments] = useState<ClientAppointment[]>([]);
  const [payments, setPayments] = useState<ClientPayment[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [highlights, setHighlights] = useState(emptyHighlights);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError('');
    try {
      const [nextUser, nextAppointments, nextPayments, notifications, nextHighlights] = await Promise.all([
        clientApiService.getMe(),
        clientApiService.getAppointments(),
        clientApiService.getPayments(),
        clientApiService.getNotifications(),
        getHomeHighlights({ forceRefresh: refresh }),
      ]);
      setUser(nextUser);
      setAppointments(nextAppointments);
      setPayments(nextPayments);
      setNotificationCount(notifications.length);
      setHighlights(nextHighlights);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar tu información.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const request = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(request);
  }, [load]);

  const upcomingAppointments = useMemo(() => appointments
    .filter(isUpcomingAppointment)
    .sort((left, right) => new Date(left.dateTime).getTime() - new Date(right.dateTime).getTime()), [appointments]);
  const completedCount = appointments.filter(({ status }) => status === 'completada').length;
  const confirmedPayments = payments.filter(({ status }) => status === 'Pagado' || status === 'Confirmado');
  const totalPaid = confirmedPayments.reduce((total, payment) => total + payment.total, 0);

  return {
    completedCount,
    error,
    highlights,
    isLoading,
    isRefreshing,
    nextAppointment: upcomingAppointments[0],
    notificationCount,
    refresh: () => load(true),
    retry: () => load(false),
    totalPaid,
    upcomingCount: upcomingAppointments.length,
    user,
  };
}
