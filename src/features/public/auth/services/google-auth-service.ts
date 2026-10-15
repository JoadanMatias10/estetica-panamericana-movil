import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import {
  getAuth,
  getIdToken,
  GoogleAuthProvider,
  signInWithCredential,
  signOut,
} from '@react-native-firebase/auth';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export class GoogleAuthCancelledError extends Error {
  constructor() {
    super('El inicio de sesión con Google fue cancelado.');
    this.name = 'GoogleAuthCancelledError';
  }
}

export class GoogleAuthServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GoogleAuthServiceError';
  }
}

let configuredWebClientId = '';
const PENDING_GOOGLE_LINK_TTL_MS = 5 * 60 * 1000;
let pendingGoogleLink: { expiresAt: number; idToken: string } | null = null;
let pendingGoogleLinkExpiryTimer: ReturnType<typeof setTimeout> | null = null;

function getGoogleWebClientId() {
  const value = Constants.expoConfig?.extra?.googleWebClientId;
  return typeof value === 'string' ? value.trim() : '';
}

function configureGoogleSignIn() {
  const webClientId = getGoogleWebClientId();
  if (!webClientId) {
    throw new GoogleAuthServiceError(
      'Falta configurar el identificador web de Google para esta aplicación.',
    );
  }

  if (configuredWebClientId === webClientId) return;
  GoogleSignin.configure({ webClientId });
  configuredWebClientId = webClientId;
}

function mapGoogleError(error: unknown) {
  if (error instanceof GoogleAuthCancelledError || error instanceof GoogleAuthServiceError) {
    return error;
  }

  if (isErrorWithCode(error)) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      return new GoogleAuthCancelledError();
    }
    if (error.code === statusCodes.IN_PROGRESS) {
      return new GoogleAuthServiceError('Ya hay un inicio de sesión con Google en proceso.');
    }
    if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return new GoogleAuthServiceError(
        'Google Play Services no está disponible o necesita actualizarse.',
      );
    }

    if (error.code === 'auth/network-request-failed') {
      return new GoogleAuthServiceError(
        'No fue posible conectar con Google. Revisa tu conexión e intenta nuevamente.',
      );
    }
    if (error.code === 'auth/user-disabled') {
      return new GoogleAuthServiceError('Esta cuenta fue deshabilitada en Firebase.');
    }
    if (
      error.code === 'auth/invalid-credential' ||
      error.code === 'auth/operation-not-allowed' ||
      error.code === 'DEVELOPER_ERROR' ||
      error.code === '10'
    ) {
      return new GoogleAuthServiceError(
        'La configuración de Google no coincide con esta aplicación. Verifica Firebase, el paquete y las huellas SHA.',
      );
    }
  }

  return new GoogleAuthServiceError(
    'No fue posible iniciar sesión con Google. Intenta nuevamente.',
  );
}

export async function getFirebaseIdTokenFromGoogle() {
  if (Platform.OS !== 'android') {
    throw new GoogleAuthServiceError(
      'El acceso con Google está configurado actualmente solo para Android.',
    );
  }

  try {
    configureGoogleSignIn();
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    const googleResponse = await GoogleSignin.signIn();
    if (!isSuccessResponse(googleResponse)) {
      throw new GoogleAuthCancelledError();
    }

    const googleIdToken = googleResponse.data.idToken;
    if (!googleIdToken) {
      throw new GoogleAuthServiceError(
        'Google no devolvió un token de identidad válido.',
      );
    }

    const googleCredential = GoogleAuthProvider.credential(googleIdToken);
    const firebaseCredential = await signInWithCredential(getAuth(), googleCredential);

    return await getIdToken(firebaseCredential.user, true);
  } catch (error) {
    throw mapGoogleError(error);
  }
}

export function rememberPendingGoogleLinkIdToken(firebaseIdToken: string) {
  const idToken = firebaseIdToken.trim();
  clearPendingGoogleLinkIdToken();
  pendingGoogleLink = idToken
    ? { expiresAt: Date.now() + PENDING_GOOGLE_LINK_TTL_MS, idToken }
    : null;
  if (pendingGoogleLink) {
    pendingGoogleLinkExpiryTimer = setTimeout(
      clearPendingGoogleLinkIdToken,
      PENDING_GOOGLE_LINK_TTL_MS,
    );
  }
}

export function clearPendingGoogleLinkIdToken() {
  pendingGoogleLink = null;
  if (pendingGoogleLinkExpiryTimer) {
    clearTimeout(pendingGoogleLinkExpiryTimer);
    pendingGoogleLinkExpiryTimer = null;
  }
}

export async function getFirebaseIdTokenForGoogleLink() {
  if (pendingGoogleLink && pendingGoogleLink.expiresAt > Date.now()) {
    const { idToken } = pendingGoogleLink;
    clearPendingGoogleLinkIdToken();
    return idToken;
  }
  clearPendingGoogleLinkIdToken();
  return getFirebaseIdTokenFromGoogle();
}

export async function clearGoogleAuthSession() {
  clearPendingGoogleLinkIdToken();
  await Promise.allSettled([
    signOut(getAuth()),
    GoogleSignin.signOut(),
  ]);
}
