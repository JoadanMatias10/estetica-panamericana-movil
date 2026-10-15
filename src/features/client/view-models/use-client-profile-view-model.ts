import { useCallback, useEffect, useState } from 'react';

import { getClientErrorMessage } from '@/features/client/components/client-appointment-helpers';
import {
  hasClientProfileErrors,
  normalizeClientProfileInput,
  validateClientProfile,
} from '@/features/client/models/client-profile-validation';
import type { ClientUser } from '@/features/client/models/client-user';
import { clientApiService } from '@/features/client/services/client-api-service';
import { pickClientProfilePhoto } from '@/features/client/services/client-profile-photo-picker';
import {
  getClientProfilePhoto,
  removeClientProfilePhoto,
  saveClientProfilePhoto,
} from '@/features/client/services/client-profile-photo-store';
import {
  saveClientUserInSession,
} from '@/features/client/services/client-session-service';
import {
  clearGoogleAuthSession,
  clearPendingGoogleLinkIdToken,
  getFirebaseIdTokenForGoogleLink,
  GoogleAuthCancelledError,
} from '@/features/public/auth/services/google-auth-service';

function localPhotoError(error: unknown, fallback: string) {
  return error instanceof Error && error.message.trim() ? error.message : fallback;
}

export function useClientProfileViewModel() {
  const [user, setUser] = useState<ClientUser>();
  const [profilePhotoUri, setProfilePhotoUri] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSelectingPhoto, setIsSelectingPhoto] = useState(false);
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [error, setError] = useState('');
  const [googleLinkError, setGoogleLinkError] = useState('');
  const [googleLinkMessage, setGoogleLinkMessage] = useState('');
  const [photoError, setPhotoError] = useState('');

  const load = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError('');
    setPhotoError('');
    try {
      const nextUser = await clientApiService.getMe();
      setUser(nextUser);
      try {
        const storedPhoto = await getClientProfilePhoto(nextUser.id);
        setProfilePhotoUri(storedPhoto?.uri ?? '');
      } catch (loadPhotoError) {
        setProfilePhotoUri('');
        setPhotoError(localPhotoError(loadPhotoError, 'No se pudo recuperar la foto guardada.'));
      }
    } catch (loadError) {
      setError(getClientErrorMessage(loadError, 'No se pudo cargar tu perfil.'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const request = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(request);
  }, [load]);

  const selectProfilePhoto = useCallback(async () => {
    if (!user || isSelectingPhoto) return;
    setIsSelectingPhoto(true);
    setPhotoError('');
    try {
      const selectedPhoto = await pickClientProfilePhoto();
      if (!selectedPhoto) return;
      const storedPhoto = await saveClientProfilePhoto(user.id, selectedPhoto);
      setProfilePhotoUri(storedPhoto.uri);
    } catch (selectionError) {
      setPhotoError(localPhotoError(selectionError, 'No se pudo seleccionar la foto.'));
    } finally {
      setIsSelectingPhoto(false);
    }
  }, [isSelectingPhoto, user]);

  const removeProfilePhoto = useCallback(async () => {
    if (!user || isSelectingPhoto) return;
    setIsSelectingPhoto(true);
    setPhotoError('');
    try {
      await removeClientProfilePhoto(user.id);
      setProfilePhotoUri('');
    } catch (removalError) {
      setPhotoError(localPhotoError(removalError, 'No se pudo eliminar la foto.'));
    } finally {
      setIsSelectingPhoto(false);
    }
  }, [isSelectingPhoto, user]);

  const linkGoogle = useCallback(async () => {
    if (!user || user.googleLinked || isLinkingGoogle) return;
    setIsLinkingGoogle(true);
    setGoogleLinkError('');
    setGoogleLinkMessage('');
    try {
      const firebaseIdToken = await getFirebaseIdTokenForGoogleLink();
      const result = await clientApiService.linkGoogle(firebaseIdToken);
      clearPendingGoogleLinkIdToken();
      await saveClientUserInSession(result.user);
      setUser(result.user);
      setGoogleLinkMessage(result.message || 'Tu cuenta de Google quedó vinculada.');
    } catch (linkError) {
      if (!(linkError instanceof GoogleAuthCancelledError)) {
        await clearGoogleAuthSession();
        setGoogleLinkError(
          getClientErrorMessage(linkError, 'No se pudo vincular la cuenta de Google.'),
        );
      }
    } finally {
      setIsLinkingGoogle(false);
    }
  }, [isLinkingGoogle, user]);

  return {
    error,
    googleLinkError,
    googleLinkMessage,
    isLoading,
    isLinkingGoogle,
    isRefreshing,
    isSelectingPhoto,
    photoError,
    profilePhotoUri,
    refresh: () => load(true),
    linkGoogle,
    removeProfilePhoto,
    retry: () => load(false),
    selectProfilePhoto,
    user,
  };
}

export function useClientEditProfileViewModel() {
  const [firstName, setFirstName] = useState('');
  const [paternalLastName, setPaternalLastName] = useState('');
  const [maternalLastName, setMaternalLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isGoogleEmail, setIsGoogleEmail] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const user = await clientApiService.getMe();
      setFirstName(user.firstName);
      setPaternalLastName(user.paternalLastName);
      setMaternalLastName(user.maternalLastName);
      setPhone(user.phone);
      setEmail(user.email);
      setIsGoogleEmail(user.googleLinked);
    } catch (loadError) {
      setError(getClientErrorMessage(loadError, 'No se pudo cargar tu perfil.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const request = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(request);
  }, [load]);

  const save = useCallback(async () => {
    if (isSaving) return null;
    const normalized = normalizeClientProfileInput({
      email,
      firstName,
      maternalLastName,
      paternalLastName,
      phone,
    });
    const validationErrors = validateClientProfile(normalized);
    if (hasClientProfileErrors(validationErrors)) {
      setSaveError(Object.values(validationErrors).find(Boolean) || 'Revisa los datos del perfil.');
      return null;
    }
    setIsSaving(true);
    setSaveError('');
    try {
      const result = await clientApiService.updateProfile(normalized);
      await saveClientUserInSession(result.user);
      return result;
    } catch (saveFailure) {
      setSaveError(getClientErrorMessage(saveFailure, 'No se pudo actualizar tu perfil.'));
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [email, firstName, isSaving, maternalLastName, paternalLastName, phone]);

  return {
    email,
    error,
    firstName,
    isLoading,
    isGoogleEmail,
    isSaving,
    maternalLastName,
    paternalLastName,
    phone,
    retry: load,
    save,
    saveError,
    setEmail,
    setFirstName,
    setMaternalLastName,
    setPaternalLastName,
    setPhone,
  };
}
