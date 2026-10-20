import { useCallback, useEffect, useRef, useState } from 'react';

import { getClientErrorMessage } from '@/features/client/components/client-appointment-helpers';
import type { ClientPaymentConfig, ClientPaymentMethod, ClientPaymentProof } from '@/features/client/models/client-payment';
import { clientApiService } from '@/features/client/services/client-api-service';
import { clientCartStore } from '@/features/client/services/client-cart-store';
import { pickClientPaymentProof } from '@/features/client/services/client-payment-proof-picker';
import { useClientCartViewModel } from '@/features/client/view-models/use-client-cart-view-model';

type CheckoutMethod = Extract<ClientPaymentMethod, 'Transferencia' | 'Pago en sucursal'>;

export function useClientProductCheckoutViewModel() {
  const { cart } = useClientCartViewModel();
  const [config, setConfig] = useState<ClientPaymentConfig>();
  const [method, setMethod] = useState<CheckoutMethod>('Pago en sucursal');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [proof, setProof] = useState<ClientPaymentProof>();
  const [isLoading, setIsLoading] = useState(true);
  const [isPicking, setIsPicking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitting = useRef(false);
  const [error, setError] = useState('');
  const [submitError, setSubmitError] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true); setError('');
    try { setConfig(await clientApiService.getPaymentConfig()); }
    catch (loadError) { setError(getClientErrorMessage(loadError, 'No se pudo cargar la configuración de pago.')); }
    finally { setIsLoading(false); }
  }, []);
  useEffect(() => {
    const request = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(request);
  }, [load]);

  const selectMethod = (next: CheckoutMethod) => {
    setMethod(next); setSubmitError('');
    if (next !== 'Transferencia') { setReference(''); setProof(undefined); }
  };

  const pickProof = useCallback(async () => {
    if (isPicking) return;
    setIsPicking(true); setSubmitError('');
    try {
      const selected = await pickClientPaymentProof();
      if (selected) setProof(selected);
    } catch (pickError) { setSubmitError(getClientErrorMessage(pickError, 'No se pudo abrir la galería.')); }
    finally { setIsPicking(false); }
  }, [isPicking]);

  const submit = useCallback(async () => {
    if (submitting.current || !cart.items.length) return null;
    if (method === 'Transferencia' && (config?.bankTransfer.isDemo || reference.trim().length < 4 || !proof)) {
      setSubmitError(config?.bankTransfer.isDemo ? 'La cuenta bancaria aún está configurada como demostración.' : 'Escribe una referencia y adjunta el comprobante.');
      return null;
    }
    submitting.current = true;
    setIsSubmitting(true); setSubmitError('');
    try {
      const result = await clientApiService.createPayment({
        items: cart.items.map((item) => ({ itemId: item.productId, quantity: item.quantity })),
        method,
        notes,
        reference,
        type: 'Producto',
      }, method === 'Transferencia' ? proof : undefined);
      await clientCartStore.clear();
      return result;
    } catch (submitFailure) {
      setSubmitError(getClientErrorMessage(submitFailure, 'No se pudo registrar el pedido.'));
      return null;
    } finally { submitting.current = false; setIsSubmitting(false); }
  }, [cart.items, config?.bankTransfer.isDemo, method, notes, proof, reference]);

  return {
    canSubmit: cart.items.length > 0 && (method === 'Pago en sucursal' || (!config?.bankTransfer.isDemo && reference.trim().length >= 4 && proof)),
    cart, config, error, isLoading, isPicking, isSubmitting, method, notes, pickProof, proof, reference,
    removeProof: () => setProof(undefined), retry: load, selectMethod, setNotes, setReference, submit, submitError,
  };
}
