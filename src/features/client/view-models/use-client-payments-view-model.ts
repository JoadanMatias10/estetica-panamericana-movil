import { useCallback, useEffect, useMemo, useState } from 'react';

import { getClientErrorMessage } from '@/features/client/components/client-appointment-helpers';
import type { ClientPayment } from '@/features/client/models/client-payment';
import { clientApiService } from '@/features/client/services/client-api-service';

export type ClientPaymentFilter = 'all' | 'pending' | 'paid' | 'rejected';

export function useClientPaymentsViewModel() {
  const [payments, setPayments] = useState<ClientPayment[]>([]);
  const [filter, setFilter] = useState<ClientPaymentFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError('');
    try { setPayments(await clientApiService.getPayments()); }
    catch (loadError) { setError(getClientErrorMessage(loadError, 'No se pudo cargar el historial de pagos.')); }
    finally { setIsLoading(false); setIsRefreshing(false); }
  }, []);
  useEffect(() => {
    const request = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(request);
  }, [load]);
  const visiblePayments = useMemo(() => payments.filter((payment) => {
    if (filter === 'all') return true;
    if (filter === 'paid') return payment.status === 'Pagado' || payment.status === 'Confirmado';
    if (filter === 'rejected') return payment.status === 'Rechazado';
    return payment.status === 'Pendiente' || payment.status === 'Procesando';
  }).sort((left, right) => new Date(right.date || right.createdAt).getTime() - new Date(left.date || left.createdAt).getTime()), [filter, payments]);
  return { error, filter, isLoading, isRefreshing, payments: visiblePayments, refresh: () => load(true), retry: () => load(false), setFilter };
}

export function useClientPaymentDetailViewModel(paymentId: string) {
  const [payment, setPayment] = useState<ClientPayment>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setIsLoading(true); setError('');
    try { setPayment((await clientApiService.getPayments()).find((item) => item.id === paymentId)); }
    catch (loadError) { setError(getClientErrorMessage(loadError, 'No se pudo cargar el pago.')); }
    finally { setIsLoading(false); }
  }, [paymentId]);
  useEffect(() => {
    const request = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(request);
  }, [load]);
  return { error, isLoading, payment, retry: load };
}
