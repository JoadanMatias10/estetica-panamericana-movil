import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { getClientErrorMessage } from '@/features/client/components/client-appointment-helpers';
import {
  hasClientProfileErrors,
  normalizeClientProfileInput,
  validateClientProfile,
} from '@/features/client/models/client-profile-validation';
import type {
  ClientProfileFormErrors,
  UpdateClientProfileInput,
} from '@/features/client/models/client-user';
import { clientApiService } from '@/features/client/services/client-api-service';
import {
  clearClientSessionData,
  saveClientUserInSession,
} from '@/features/client/services/client-session-service';

const INITIAL_FORM: UpdateClientProfileInput = {
  email: '',
  firstName: '',
  maternalLastName: '',
  paternalLastName: '',
  phone: '',
};

export function useClientCompleteProfileViewModel() {
  const router = useRouter();
  const [form, setForm] = useState<UpdateClientProfileInput>(INITIAL_FORM);
  const [errors, setErrors] = useState<ClientProfileFormErrors>({});
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [isGoogleEmail, setIsGoogleEmail] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const user = await clientApiService.getMe();
      setForm({
        email: user.email,
        firstName: user.firstName,
        maternalLastName: user.maternalLastName,
        paternalLastName: user.paternalLastName,
        phone: user.phone,
      });
      setIsGoogleEmail(user.googleLinked);
    } catch (error) {
      setLoadError(getClientErrorMessage(error, 'No se pudieron cargar tus datos.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const request = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(request);
  }, [load]);

  const updateField = useCallback((field: keyof UpdateClientProfileInput, value: string) => {
    const nextValue = field === 'phone' ? value.replace(/\D/g, '').slice(0, 10) : value;
    setForm((current) => ({ ...current, [field]: nextValue }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSaveError('');
  }, []);

  const save = useCallback(async () => {
    if (isSaving || isCancelling) return false;

    const normalized = normalizeClientProfileInput(form);
    const validationErrors = validateClientProfile(normalized);
    setErrors(validationErrors);
    setSaveError('');
    if (hasClientProfileErrors(validationErrors)) return false;

    setIsSaving(true);
    try {
      const result = await clientApiService.updateProfile(normalized);
      await saveClientUserInSession(result.user);
      router.replace('/client');
      return true;
    } catch (error) {
      setSaveError(getClientErrorMessage(error, 'No se pudo completar tu perfil.'));
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [form, isCancelling, isSaving, router]);

  const cancel = useCallback(async () => {
    if (isSaving || isCancelling) return;
    setIsCancelling(true);
    await clearClientSessionData();
    router.replace('/public/login');
  }, [isCancelling, isSaving, router]);

  return {
    cancel,
    errors,
    form,
    isCancelling,
    isGoogleEmail,
    isLoading,
    isSaving,
    loadError,
    retry: load,
    save,
    saveError,
    updateField,
  };
}
