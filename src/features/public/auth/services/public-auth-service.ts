import type {
  AuthenticatedResponse,
  GoogleLoginCredentials,
  LoginCredentials,
  MessageResponse,
  RegisterAccountData,
  ResetTokenResponse,
} from '@/features/public/auth/models/public-auth-models';
import { PUBLIC_API_BASE_URL } from '@/features/public/services/public-api-service';

// El servicio puede tardar al reactivarse después de un periodo sin uso.
const REQUEST_TIMEOUT_MS = 60_000;

type ApiErrorPayload = {
  code?: unknown;
  error?: unknown;
  errors?: unknown;
  message?: unknown;
};

export class PublicAuthServiceError extends Error {
  readonly backendCode: string;
  readonly details: string[];
  readonly status: number | null;

  constructor(
    message: string,
    status: number | null = null,
    details: string[] = [],
    backendCode = '',
  ) {
    super(message);
    this.name = 'PublicAuthServiceError';
    this.backendCode = backendCode;
    this.status = status;
    this.details = details;
  }
}

function getErrorMessages(payload: ApiErrorPayload | null) {
  if (!payload) return [];

  if (Array.isArray(payload.errors)) {
    return payload.errors.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  }

  for (const candidate of [payload.error, payload.message]) {
    if (typeof candidate === 'string' && candidate.trim()) return [candidate.trim()];
  }

  return [];
}

async function requestJson<TResponse>(path: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${PUBLIC_API_BASE_URL}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
      signal: controller.signal,
    });

    const payload = (await response.json().catch(() => null)) as (TResponse & ApiErrorPayload) | null;

    if (!response.ok) {
      const messages = getErrorMessages(payload);
      throw new PublicAuthServiceError(
        messages[0] || 'No fue posible procesar la solicitud.',
        response.status,
        messages,
        typeof payload?.code === 'string' ? payload.code.trim() : '',
      );
    }

    if (!payload) {
      throw new PublicAuthServiceError('El servidor respondió sin datos.', response.status);
    }

    return payload as TResponse;
  } catch (error) {
    if (error instanceof PublicAuthServiceError) throw error;

    if (error instanceof Error && error.name === 'AbortError') {
      throw new PublicAuthServiceError('El servidor tardó demasiado en responder. Intenta nuevamente.');
    }

    throw new PublicAuthServiceError(
      'No fue posible conectar con el servidor. Revisa tu conexión e intenta nuevamente.',
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export const publicAuthService = {
  googleLogin(credentials: GoogleLoginCredentials) {
    return requestJson<AuthenticatedResponse>('/public/google-login', {
      body: JSON.stringify(credentials),
      method: 'POST',
    });
  },

  login(credentials: LoginCredentials) {
    return requestJson<AuthenticatedResponse>('/public/login', {
      body: JSON.stringify(credentials),
      method: 'POST',
    });
  },

  register(account: RegisterAccountData) {
    return requestJson<AuthenticatedResponse>('/public/register', {
      body: JSON.stringify(account),
      method: 'POST',
    });
  },

  recoverPassword(correo: string) {
    return requestJson<MessageResponse>('/public/recover', {
      body: JSON.stringify({ correo, origen: 'movil' }),
      method: 'POST',
    });
  },

  validateResetToken(token: string) {
    return requestJson<ResetTokenResponse>(
      `/public/reset-password/validate?token=${encodeURIComponent(token)}`,
    );
  },

  resetPassword(token: string, password: string) {
    return requestJson<MessageResponse>('/public/reset-password', {
      body: JSON.stringify({ password, token }),
      method: 'POST',
    });
  },
};
