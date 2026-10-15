import { router } from 'expo-router';
import { useCallback, useState } from 'react';

import type {
  FormErrors,
  ResetPasswordForm,
} from '@/features/public/auth/models/public-auth-models';
import {
  hasFormErrors,
  validateResetPasswordForm,
} from '@/features/public/auth/models/public-auth-validation';
import { publicAuthService } from '@/features/public/auth/services/public-auth-service';
import { usePublicApiResource } from '@/features/public/view-models/use-public-api-resource';

const INITIAL_FORM: ResetPasswordForm = {
  confirmarPassword: '',
  password: '',
};

export function useResetPasswordViewModel(rawToken: string) {
  const token = rawToken.trim();
  const validateToken = useCallback(async () => {
    if (!token) throw new Error('El enlace de recuperación no contiene un token válido.');
    return publicAuthService.validateResetToken(token);
  }, [token]);
  const tokenResource = usePublicApiResource(validateToken);
  const [form, setForm] = useState<ResetPasswordForm>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors<ResetPasswordForm>>({});
  const [submissionError, setSubmissionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const tokenState = tokenResource.isLoading && !tokenResource.data
    ? 'loading'
    : tokenResource.data
      ? 'valid'
      : 'invalid';

  const updateField = (field: keyof ResetPasswordForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmissionError('');
  };

  const submit = async () => {
    if (isSubmitting || tokenState !== 'valid') return;

    const validationErrors = validateResetPasswordForm(form);
    setErrors(validationErrors);
    setSubmissionError('');
    if (hasFormErrors(validationErrors)) return;

    setIsSubmitting(true);
    try {
      const response = await publicAuthService.resetPassword(token, form.password);
      setSuccessMessage(response.message || 'Tu contraseña se actualizó correctamente.');
      setForm(INITIAL_FORM);
    } catch (error) {
      setSubmissionError(
        error instanceof Error ? error.message : 'No fue posible actualizar la contraseña.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    errors,
    form,
    isSubmitting,
    requestError: submissionError || tokenResource.error || '',
    successMessage,
    tokenState: tokenState as 'invalid' | 'loading' | 'valid',
    tokenUser: tokenResource.data?.user ?? null,
    goBack: () => router.replace('/public/login'),
    goToRecoverPassword: () => router.replace('/public/recover-password'),
    goToLogin: () => router.replace('/public/login'),
    retryTokenValidation: tokenResource.onRetry,
    submit,
    updateField,
  };
}
