import { PUBLIC_API_BASE_URL } from '@/features/public/services/public-api-service';

export type AccountDeletionConfirmation = { accepted: true; message: string };

async function request(path: 'request' | 'confirm', body: Record<string, string>) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch(`${PUBLIC_API_BASE_URL}/public/account-deletion/${path}`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const payload: unknown = await response.json().catch(() => null);
    const record = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
    if (!response.ok) {
      throw new Error(typeof record.error === 'string' ? record.error : 'No se pudo procesar la solicitud. Inténtalo nuevamente.');
    }
    if (typeof record.message !== 'string' || !record.message.trim() || (path === 'confirm' && record.accepted !== true)) {
      throw new Error('El servidor no confirmó la solicitud. Inténtalo nuevamente.');
    }
    return record;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('El servidor tardó demasiado en responder. Inténtalo nuevamente.');
    }
    if (error instanceof TypeError) throw new Error('No se pudo conectar. Revisa tu conexión e inténtalo nuevamente.');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export const accountDeletionService = {
  async requestCode(email: string) {
    const result = await request('request', { correo: email.trim().toLowerCase() });
    return { message: result.message as string };
  },
  async confirm(email: string, code: string): Promise<AccountDeletionConfirmation> {
    const result = await request('confirm', {
      correo: email.trim().toLowerCase(), codigo: code.trim(), confirmacion: 'ELIMINAR',
    });
    return { accepted: true, message: result.message as string };
  },
};
