import { useEffect, useRef, useState } from 'react';

import { accountDeletionService } from '@/features/client/services/account-deletion-service';
import { removeClientProfilePhoto } from '@/features/client/services/client-profile-photo-store';
import { clearClientSessionData } from '@/features/client/services/client-session-service';
import { validateRecoverPasswordForm } from '@/features/public/auth/models/public-auth-validation';
import { getPublicAuthSession } from '@/features/public/auth/services/public-auth-session';

export function useAccountDeletionViewModel() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [hasCode, setHasCode] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [result, setResult] = useState('');
  const busy = useRef(false);
  const emailEdited = useRef(false);

  useEffect(() => {
    let mounted = true;
    void getPublicAuthSession().then((session) => {
      if (mounted && !emailEdited.current && session?.user.role === 'client') setEmail(session.user.correo);
    });
    return () => { mounted = false; };
  }, []);

  const updateEmail = (value: string) => {
    if (busy.current || result) return;
    emailEdited.current = true;
    setEmail(value);
    setCode('');
    setHasCode(false);
    setAcknowledged(false);
    setError('');
    setNotice('');
  };

  const submit = async (confirm: boolean) => {
    if (busy.current || result) return;
    const emailError = validateRecoverPasswordForm({ correo: email }).correo;
    if (emailError) { setError(emailError); return; }
    if (confirm && (!hasCode || !/^\d{8}$/.test(code) || !acknowledged)) {
      setError('Escribe el código de 8 dígitos y acepta la confirmación.');
      return;
    }
    busy.current = true;
    setIsBusy(true);
    setError('');
    setNotice('');
    try {
      if (confirm) {
        const response = await accountDeletionService.confirm(email, code);
        const session = await getPublicAuthSession();
        if (session?.user.role === 'client' && session.user.correo.trim().toLowerCase() === email.trim().toLowerCase()) {
          // A failed local photo cleanup must not report that server confirmation failed.
          await Promise.allSettled([removeClientProfilePhoto(session.user.id), clearClientSessionData()]);
        }
        setCode('');
        setAcknowledged(false);
        setResult(response.message);
      } else {
        const response = await accountDeletionService.requestCode(email);
        setHasCode(true);
        setCode('');
        setAcknowledged(false);
        setNotice(response.message);
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'No se pudo procesar la solicitud.');
    } finally {
      busy.current = false;
      setIsBusy(false);
    }
  };

  return {
    acknowledged, code, email, error, hasCode, isBusy, notice, result,
    updateEmail,
    updateCode: (value: string) => { if (!busy.current) { setCode(value.replace(/\D/g, '').slice(0, 8)); setError(''); } },
    toggleAcknowledged: () => { if (!busy.current) setAcknowledged((value) => !value); },
    requestCode: () => submit(false),
    confirm: () => submit(true),
  };
}
