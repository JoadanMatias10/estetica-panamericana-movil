import { router } from 'expo-router';
import { useMemo, useState } from 'react';

import type { FormErrors, RegisterForm } from '@/features/public/auth/models/public-auth-models';
import { getPasswordRequirementStates } from '@/features/public/auth/models/password-requirements';
import {
  hasFormErrors,
  normalizeEmail,
  validateRegisterForm,
} from '@/features/public/auth/models/public-auth-validation';
import { publicAuthService } from '@/features/public/auth/services/public-auth-service';
import { savePublicAuthSession } from '@/features/public/auth/services/public-auth-session';

const INITIAL_FORM: RegisterForm = {
  aceptaPrivacidad: false,
  apellidoMaterno: '',
  apellidoPaterno: '',
  confirmarPassword: '',
  correo: '',
  nombre: '',
  password: '',
  telefono: '',
};

export function useRegisterViewModel() {
  const [form, setForm] = useState<RegisterForm>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors<RegisterForm>>({});
  const [requestError, setRequestError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const passwordRequirements = useMemo(
    () => getPasswordRequirementStates(form.password),
    [form.password],
  );

  const updateTextField = (
    field: Exclude<keyof RegisterForm, 'aceptaPrivacidad'>,
    value: string,
  ) => {
    const nextValue = field === 'telefono' ? value.replace(/\D/g, '').slice(0, 10) : value;
    setForm((current) => ({ ...current, [field]: nextValue }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setRequestError('');
  };

  const togglePrivacyAcceptance = () => {
    setForm((current) => ({ ...current, aceptaPrivacidad: !current.aceptaPrivacidad }));
    setErrors((current) => ({ ...current, aceptaPrivacidad: undefined }));
    setRequestError('');
  };

  const submit = async () => {
    if (isSubmitting) return;

    const validationErrors = validateRegisterForm(form);
    setErrors(validationErrors);
    setRequestError('');
    if (hasFormErrors(validationErrors)) return;

    setIsSubmitting(true);
    try {
      const response = await publicAuthService.register({
        apellidoMaterno: form.apellidoMaterno.trim(),
        apellidoPaterno: form.apellidoPaterno.trim(),
        correo: normalizeEmail(form.correo),
        nombre: form.nombre.trim(),
        password: form.password,
        telefono: form.telefono,
      });
      await savePublicAuthSession({ token: response.token, user: response.user });
      router.replace('/client');
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'No fue posible crear la cuenta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    errors,
    form,
    isSubmitting,
    passwordRequirements,
    requestError,
    goBack: () => router.replace('/public/login'),
    goToLogin: () => router.replace('/public/login'),
    openPrivacyNotice: () => router.push('/public/more/privacy'),
    submit,
    togglePrivacyAcceptance,
    updateTextField,
  };
}
