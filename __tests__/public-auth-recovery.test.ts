/// <reference types="jest" />
import { createURL } from 'expo-linking';
import { Platform } from 'react-native';

import { publicAuthService } from '../src/features/public/auth/services/public-auth-service';

jest.mock('expo-linking', () => ({ createURL: jest.fn() }));
jest.mock('../src/features/public/services/public-api-service', () => ({
  PUBLIC_API_BASE_URL: 'https://api.example.test/api',
}));

const originalFetch = globalThis.fetch;
const originalPlatform = Platform.OS;
const fetchMock = jest.fn<Promise<Response>, [input: RequestInfo | URL, init?: RequestInit]>();

function setPlatform(value: typeof Platform.OS) {
  Object.defineProperty(Platform, 'OS', { configurable: true, value });
}

function sentBody() {
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [url, options] = fetchMock.mock.calls[0];
  expect(String(url)).toBe('https://api.example.test/api/public/recover');
  expect(options?.method).toBe('POST');
  return JSON.parse(String(options?.body));
}

beforeAll(() => { globalThis.fetch = fetchMock; });
beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ message: 'Enviado' }) } as Response);
  jest.mocked(createURL).mockReset();
  setPlatform('android');
});
afterAll(() => {
  globalThis.fetch = originalFetch;
  setPlatform(originalPlatform);
});

describe('recuperación de contraseña pública', () => {
  it('envía en Android el enlace profundo que genera Expo para la pantalla de restablecimiento', async () => {
    jest.mocked(createURL).mockReturnValue('esteticapanamericana://public/reset-password');

    await expect(publicAuthService.recoverPassword('cliente@example.test')).resolves.toEqual({ message: 'Enviado' });

    expect(createURL).toHaveBeenCalledWith('public/reset-password');
    expect(sentBody()).toEqual({
      correo: 'cliente@example.test', origen: 'movil',
      mobileResetUrl: 'esteticapanamericana://public/reset-password',
    });
  });

  it('envía en Expo Go la URL de retorno con /--/ sin sustituirla por una URL web', async () => {
    const expoGoUrl = 'exp://192.0.2.10:8081/--/public/reset-password';
    jest.mocked(createURL).mockReturnValue(expoGoUrl);

    await publicAuthService.recoverPassword('cliente@example.test');

    expect(sentBody()).toEqual({ correo: 'cliente@example.test', origen: 'movil', mobileResetUrl: expoGoUrl });
  });

  it('mantiene el flujo web sin generar un enlace móvil', async () => {
    setPlatform('web');

    await publicAuthService.recoverPassword('web@example.test');

    expect(createURL).not.toHaveBeenCalled();
    expect(sentBody()).toEqual({ correo: 'web@example.test', origen: 'web' });
  });
});
