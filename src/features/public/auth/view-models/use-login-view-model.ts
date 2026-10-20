import { router } from 'expo-router';
import { useRef, useState } from 'react';

import { adoptClientSession } from '@/features/client/services/client-session-service';
import { savePublicAuthSession } from '@/features/public/auth/services/public-auth-session';
import type { FormErrors, LoginForm } from '@/features/public/auth/models/public-auth-models';
import {
  hasFormErrors,
  normalizeEmail,
  validateLoginForm,
} from '@/features/public/auth/models/public-auth-validation';
import {
  PublicAuthServiceError,
  publicAuthService,
} from '@/features/public/auth/services/public-auth-service';
import {
  clearGoogleAuthSession,
  getFirebaseIdTokenFromGoogle,
  GoogleAuthCancelledError,
  rememberPendingGoogleLinkIdToken,
} from '@/features/public/auth/services/google-auth-service';

const INITIAL_FORM: LoginForm = {
  correo: '',
  password: '',
};

export function useLoginViewModel() {
  const authRequestInProgress = useRef(false);
  const [form, setForm] = useState<LoginForm>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors<LoginForm>>({});
  const [requestError, setRequestError] = useState('');
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: keyof LoginForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setRequestError('');
  };

  const submit = async () => {
    if (authRequestInProgress.current) return;

    const validationErrors = validateLoginForm(form);
    setErrors(validationErrors);
    setRequestError('');
    if (hasFormErrors(validationErrors)) return;

    authRequestInProgress.current = true;
    setIsSubmitting(true);
    try {
      const response = await publicAuthService.login({
        correo: normalizeEmail(form.correo),
        password: form.password,
      });
      if (response.user.role === 'stylist') {
        await savePublicAuthSession({ token: response.token, user: response.user });
        router.replace('/stylist');
        return;
      }
      await adoptClientSession({ token: response.token, user: response.user });
      router.replace(response.user.profileComplete === false ? '/client/complete-profile' : '/client');
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'No fue posible iniciar sesión.');
    } finally {
      authRequestInProgress.current = false;
      setIsSubmitting(false);
    }
  };

  const signInWithGoogle = async () => {
    if (authRequestInProgress.current) return;

    authRequestInProgress.current = true;
    setErrors({});
    setRequestError('');
    setIsGoogleSubmitting(true);
    let firebaseIdToken = '';
    let hasFirebaseSession = false;

    try {
      firebaseIdToken = await getFirebaseIdTokenFromGoogle();
      hasFirebaseSession = true;
      const response = await publicAuthService.googleLogin({ firebaseIdToken });

      if (response.user.role !== 'client') {
        throw new Error('El acceso con Google está disponible únicamente para clientes.');
      }

      await adoptClientSession({ token: response.token, user: response.user });
      router.replace(response.user.profileComplete === false ? '/client/complete-profile' : '/client');
    } catch (error) {
      if (!(error instanceof GoogleAuthCancelledError)) {
        const accountLinkRequired = error instanceof PublicAuthServiceError &&
          error.status === 409 &&
          error.backendCode === 'ACCOUNT_LINK_REQUIRED';

        if (accountLinkRequired && firebaseIdToken) {
          // Se cierra la sesión externa y se conserva solo un token efímero en memoria.
          await clearGoogleAuthSession();
          rememberPendingGoogleLinkIdToken(firebaseIdToken);
        } else if (hasFirebaseSession) {
          await clearGoogleAuthSession();
        }
        const message = error instanceof Error
          ? error.message
          : 'No fue posible iniciar sesión con Google.';
        setRequestError(accountLinkRequired
          ? `${message} Inicia sesión con tu correo y contraseña y después vincula Google desde Perfil.`
          : message);
      }
    } finally {
      authRequestInProgress.current = false;
      setIsGoogleSubmitting(false);
    }
  };

  const leaveLogin = (navigate: () => void) => {
    void clearGoogleAuthSession().finally(navigate);
  };

  return {
    errors,
    form,
    isGoogleSubmitting,
    isSubmitting,
    requestError,
    goBack: () => leaveLogin(() => router.replace('/public')),
    goToRecoverPassword: () => leaveLogin(() => router.push('/public/recover-password')),
    goToRegister: () => leaveLogin(() => router.push('/public/register')),
    signInWithGoogle,
    submit,
    updateField,
  };
}
