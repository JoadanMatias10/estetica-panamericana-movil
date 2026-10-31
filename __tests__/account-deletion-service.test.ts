/// <reference types="jest" />
import { accountDeletionService } from '../src/features/client/services/account-deletion-service';

jest.mock('../src/features/public/services/public-api-service', () => ({ PUBLIC_API_BASE_URL: 'https://api.example.com/api' }));
const originalFetch = globalThis.fetch;
const mockFetch = jest.fn();
beforeEach(() => { mockFetch.mockReset(); globalThis.fetch = mockFetch; });
afterAll(() => { globalThis.fetch = originalFetch; });

it('solicita el código sin enviar sesión ni identificadores de otros usuarios', async () => {
  mockFetch.mockResolvedValue({ ok: true, json: async () => ({ message: 'Revisa tu correo.' }) });
  await accountDeletionService.requestCode(' CLIENTE@EXAMPLE.COM ');
  expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/api/public/account-deletion/request', expect.objectContaining({
    method: 'POST', body: JSON.stringify({ correo: 'cliente@example.com' }),
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
  }));
});

it('un HTTP exitoso sin aceptación explícita nunca se trata como eliminación confirmada', async () => {
  mockFetch.mockResolvedValue({ ok: true, json: async () => ({ message: 'Respuesta incompleta' }) });
  await expect(accountDeletionService.confirm('cliente@example.com', '12345678')).rejects.toThrow('El servidor no confirmó');
});

it('comunica un código rechazado y solo acepta la respuesta del servidor', async () => {
  mockFetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Código no válido' }) });
  await expect(accountDeletionService.confirm('cliente@example.com', '12345678')).rejects.toThrow('Código no válido');
  mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ accepted: true, message: 'En proceso' }) });
  await expect(accountDeletionService.confirm('cliente@example.com', '12345678')).resolves.toEqual({ accepted: true, message: 'En proceso' });
});
