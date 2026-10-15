import type { ClientUser } from '@/features/client/models/client-user';
import { clientCartStore } from '@/features/client/services/client-cart-store';
import { clearGoogleAuthSession } from '@/features/public/auth/services/google-auth-service';
import type {
  PublicAuthSession,
  PublicAuthUser,
} from '@/features/public/auth/models/public-auth-models';
import {
  clearPublicAuthSession,
  getPublicAuthSession,
  savePublicAuthSession,
} from '@/features/public/auth/services/public-auth-session';

export function clientUserToAuthUser(user: ClientUser): PublicAuthUser {
  return {
    accountStatus: user.accountStatus ?? 'active',
    apellidoMaterno: user.maternalLastName,
    apellidoPaterno: user.paternalLastName,
    correo: user.email,
    googleLinked: user.googleLinked,
    id: user.id,
    missingProfileFields: [...user.missingProfileFields],
    nombre: user.firstName,
    profileComplete: user.profileComplete,
    role: 'client',
    telefono: user.phone,
  };
}

export async function adoptClientSession(session: PublicAuthSession) {
  if (session.user.role !== 'client') {
    throw new Error('Esta seccion esta disponible unicamente para clientes.');
  }

  const previousSession = await getPublicAuthSession();
  if (!previousSession || previousSession.user.id !== session.user.id) {
    await clientCartStore.clear();
  }

  await savePublicAuthSession(session);
}

export async function saveClientUserInSession(user: ClientUser, replacementToken = '') {
  const session = await getPublicAuthSession();
  const token = replacementToken.trim() || session?.token.trim();
  if (!token) return false;

  await savePublicAuthSession({
    token,
    user: clientUserToAuthUser(user),
  });
  return true;
}

export async function clearClientSessionData() {
  await Promise.allSettled([
    clearPublicAuthSession(),
    clearGoogleAuthSession(),
    clientCartStore.clear(),
  ]);
}
