import { useCallback, useEffect, useState } from 'react';

import { ClientApiError, clientApiService } from '@/features/client/services/client-api-service';
import {
  clearClientSessionData,
  clientUserToAuthUser,
  saveClientUserInSession,
} from '@/features/client/services/client-session-service';
import type { PublicAuthUser } from '@/features/public/auth/models/public-auth-models';
import {
  getActivePublicAuthSession,
  getPublicAuthSession,
  subscribePublicAuthSession,
} from '@/features/public/auth/services/public-auth-session';

export function useClientSessionViewModel() {
  const [user, setUser] = useState<PublicAuthUser>();
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState('');

  const checkSession = useCallback(async () => {
    setIsChecking(true);
    setError('');

    const session = await getPublicAuthSession();
    if (!session || session.user.role !== 'client') {
      await clearClientSessionData();
      setUser(undefined);
      setIsChecking(false);
      return false;
    }

    try {
      const refreshedUser = await clientApiService.getMe();
      await saveClientUserInSession(refreshedUser);
      setUser(clientUserToAuthUser(refreshedUser));
      return true;
    } catch (checkError) {
      if (
        checkError instanceof ClientApiError &&
        (checkError.code === 'session-required' || checkError.code === 'access-denied')
      ) {
        await clearClientSessionData();
        setUser(undefined);
        return false;
      }

      setUser(undefined);
      setError(
        checkError instanceof Error && checkError.message.trim()
          ? checkError.message
          : 'No se pudo comprobar tu sesión. Intenta nuevamente.',
      );
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    const syncActiveSession = () => {
      const session = getActivePublicAuthSession();
      setUser(session?.user.role === 'client' ? session.user : undefined);
    };
    const unsubscribe = subscribePublicAuthSession(syncActiveSession);
    const request = setTimeout(() => { void checkSession(); }, 0);
    return () => {
      clearTimeout(request);
      unsubscribe();
    };
  }, [checkSession]);

  const signOut = useCallback(async () => {
    await clearClientSessionData();
    setUser(undefined);
  }, []);

  return { checkSession, error, isChecking, signOut, user };
}
