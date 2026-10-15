import { router } from 'expo-router';
import { useState } from 'react';

import type {
  FormErrors,
  RecoverPasswordForm,
} from '@/features/public/auth/models/public-auth-models';
import {
  hasFormErrors,
  normalizeEmail,
  validateRecoverPasswordForm,
} from '@/features/public/auth/models/public-auth-validation';
import { publicAuthService } from '@/features/public/auth/services/public-auth-service';

const INITIAL_FORM: RecoverPasswordForm = { correo: '' };

export function useRecoverPasswordViewModel() {
  const [form, setForm] = useState<RecoverPasswordForm>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors<RecoverPasswordForm>>({});
  const [requestError, setRequestError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateEmail = (correo: string) => {
    setForm({ correo });
    setErrors({});
    setRequestError('');
    setSuccessMessage('');
  };

  const submit = async () => {
    if (isSubmitting) return;

    const validationErrors = validateRecoverPasswordForm(form);
    setErrors(validationErrors);
    setRequestError('');
    setSuccessMessage('');
    if (hasFormErrors(validationErrors)) return;

    setIsSubmitting(true);
    try {
      const response = await publicAuthService.recoverPassword(normalizeEmail(form.correo));
      setSuccessMessage(response.message || 'Revisa tu correo para continuar con la recuperación.');
      setForm(INITIAL_FORM);
    } catch (error) {
      setRequestError(
        error instanceof Error ? error.message : 'No fue posible enviar el enlace de recuperación.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    errors,
    form,
    isSubmitting,
    requestError,
    successMessage,
    goBack: () => router.replace('/public/login'),
    goToLogin: () => router.replace('/public/login'),
    submit,
    updateEmail,
  };
}
