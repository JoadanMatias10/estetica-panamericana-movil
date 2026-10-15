import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { PublicAuthSession } from '@/features/public/auth/models/public-auth-models';

const SESSION_STORAGE_KEY = 'estetica-panamericana.auth-session.v1';

let activeSession: PublicAuthSession | null = null;
const sessionListeners = new Set<() => void>();

function copySession(session: PublicAuthSession): PublicAuthSession {
  return {
    token: session.token,
    user: {
      ...session.user,
      missingProfileFields: [...(session.user.missingProfileFields ?? [])],
    },
  };
}

function notifySessionListeners() {
  sessionListeners.forEach((listener) => listener());
}

function isStoredSession(value: unknown): value is PublicAuthSession {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<PublicAuthSession>;
  return typeof candidate.token === 'string' && candidate.token.length > 0 &&
    Boolean(candidate.user && typeof candidate.user === 'object');
}

export async function savePublicAuthSession(session: PublicAuthSession) {
  activeSession = copySession(session);
  notifySessionListeners();
  if (Platform.OS === 'web') return;

  try {
    await SecureStore.setItemAsync(SESSION_STORAGE_KEY, JSON.stringify(session), {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch {
    // La sesión activa sigue disponible en memoria si el almacén del dispositivo falla.
  }
}

export async function getPublicAuthSession() {
  if (activeSession) return copySession(activeSession);
  if (Platform.OS === 'web') return null;

  try {
    const storedValue = await SecureStore.getItemAsync(SESSION_STORAGE_KEY);
    if (!storedValue) return null;
    const parsed: unknown = JSON.parse(storedValue);
    if (!isStoredSession(parsed)) {
      await SecureStore.deleteItemAsync(SESSION_STORAGE_KEY);
      return null;
    }
    activeSession = copySession(parsed);
    notifySessionListeners();
    return copySession(parsed);
  } catch {
    return null;
  }
}

export async function clearPublicAuthSession() {
  activeSession = null;
  notifySessionListeners();
  if (Platform.OS === 'web') return;

  try {
    await SecureStore.deleteItemAsync(SESSION_STORAGE_KEY);
  } catch {
    // La sesión en memoria ya quedó eliminada.
  }
}

export function getActivePublicAuthSession() {
  return activeSession ? copySession(activeSession) : null;
}

export function subscribePublicAuthSession(listener: () => void) {
  sessionListeners.add(listener);
  return () => sessionListeners.delete(listener);
}
