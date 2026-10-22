import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { canPayAppointment, getClientErrorMessage } from '@/features/client/components/client-appointment-helpers';
import type { ClientAppointment } from '@/features/client/models/client-appointment';
import type {
  ClientPaymentConfig,
  ClientPaymentMethod,
  ClientPaymentProof,
} from '@/features/client/models/client-payment';
import { clientApiService } from '@/features/client/services/client-api-service';
import { pickClientPaymentProof } from '@/features/client/services/client-payment-proof-picker';

type AvailablePaymentMethod = Extract<ClientPaymentMethod, 'Transferencia' | 'Pago en sucursal'>;

type ClientServicePaymentInitialSelection = {
  appointmentId?: string;
  serviceId?: string;
};

export function useClientServicePaymentViewModel(initial: ClientServicePaymentInitialSelection = {}) {
  const [appointments, setAppointments] = useState<ClientAppointment[]>([]);
  const [config, setConfig] = useState<ClientPaymentConfig>();
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(initial.appointmentId ?? '');
  const [method, setMethod] = useState<AvailablePaymentMethod>('Pago en sucursal');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [proof, setProof] = useState<ClientPaymentProof>();
  const [isLoading, setIsLoading] = useState(true);
  const [isPickingProof, setIsPickingProof] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionInFlight = useRef(false);
  const [error, setError] = useState('');
  const [submitError, setSubmitError] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [appointmentItems, paymentConfig] = await Promise.all([
        clientApiService.getAppointments(),
        clientApiService.getPaymentConfig(),
      ]);
      const payable = appointmentItems.filter((appointment) =>
        canPayAppointment(appointment) && (!initial.serviceId || appointment.serviceId === initial.serviceId));
      setAppointments(payable);
      setConfig(paymentConfig);
      setSelectedAppointmentId((current) => {
        if (payable.some((appointment) => appointment.id === current)) return current;
        if (initial.appointmentId && payable.some((appointment) => appointment.id === initial.appointmentId)) {
          return initial.appointmentId;
        }
        return payable[0]?.id ?? '';
      });
    } catch (loadError) {
      setError(getClientErrorMessage(loadError, 'No fue posible preparar el pago.'));
    } finally {
      setIsLoading(false);
    }
  }, [initial.appointmentId, initial.serviceId]);

  useEffect(() => {
    const request = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(request);
  }, [load]);

  const selectedAppointment = useMemo(
    () => appointments.find((appointment) => appointment.id === selectedAppointmentId),
    [appointments, selectedAppointmentId],
  );

  const selectMethod = (value: AvailablePaymentMethod) => {
    setMethod(value);
    setSubmitError('');
    if (value !== 'Transferencia') {
      setReference('');
      setProof(undefined);
    }
  };

  const pickProof = useCallback(async () => {
    if (isPickingProof) return;
    setIsPickingProof(true);
    setSubmitError('');
    try {
      const nextProof = await pickClientPaymentProof();
      if (nextProof) setProof(nextProof);
    } catch (pickerError) {
      setSubmitError(getClientErrorMessage(pickerError, 'No se pudo abrir la galería.'));
    } finally {
      setIsPickingProof(false);
    }
  }, [isPickingProof]);

  const submit = useCallback(async () => {
    if (submissionInFlight.current) return null;
    if (!selectedAppointment?.serviceId) {
      setSubmitError('Selecciona una cita válida con un servicio asociado.');
      return null;
    }
    if (method === 'Transferencia') {
      if (config?.bankTransfer.isDemo) {
        setSubmitError('La transferencia no está disponible porque los datos bancarios son de demostración.');
        return null;
      }
      if (reference.trim().length < 4 || !proof) {
        setSubmitError('Escribe la referencia y adjunta el comprobante de transferencia.');
        return null;
      }
    }
    submissionInFlight.current = true;
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const result = await clientApiService.createPayment({
        appointmentId: selectedAppointment.id,
        items: [{ itemId: selectedAppointment.serviceId, quantity: 1 }],
        method,
        notes,
        reference,
        type: 'Servicio',
      }, method === 'Transferencia' ? proof : undefined);
      return result;
    } catch (submitFailure) {
      setSubmitError(getClientErrorMessage(submitFailure, 'No se pudo registrar el pago.'));
      return null;
    } finally {
      submissionInFlight.current = false;
      setIsSubmitting(false);
    }
  }, [config?.bankTransfer.isDemo, method, notes, proof, reference, selectedAppointment]);

  return {
    appointments,
    canSubmit: Boolean(selectedAppointment) &&
      (method === 'Pago en sucursal' ||
        (!config?.bankTransfer.isDemo && reference.trim().length >= 4 && proof)),
    config,
    error,
    isLoading,
    isPickingProof,
    isSubmitting,
    method,
    notes,
    pickProof,
    proof,
    reference,
    removeProof: () => setProof(undefined),
    retry: load,
    selectedAppointment,
    selectedAppointmentId,
    selectMethod,
    setNotes,
    setReference,
    setSelectedAppointmentId,
    submit,
    submitError,
  };
}
