/// <reference types="jest" />
import * as SecureStore from 'expo-secure-store';

import {
  getNotificationsReadAt,
  saveNotificationsReadAt,
} from '../src/features/stylist/services/stylist-notification-store';

jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn() }));

beforeEach(() => jest.clearAllMocks());

describe('marca de lectura local del estilista', () => {
  it('normaliza una marca válida y limita la clave al identificador seguro', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue('2026-10-20T10:00:00-06:00');
    await expect(getNotificationsReadAt('stylist/1')).resolves.toBe('2026-10-20T16:00:00.000Z');
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('stylist.notifications-read.stylist1');
  });

  it('ignora marcas corruptas o errores de lectura', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValueOnce('fecha inválida')
      .mockRejectedValueOnce(new Error('Sin almacenamiento'));
    await expect(getNotificationsReadAt('s-1')).resolves.toBe('');
    await expect(getNotificationsReadAt('s-1')).resolves.toBe('');
  });

  it('guarda la marca y tolera un fallo de almacenamiento', async () => {
    jest.mocked(SecureStore.setItemAsync).mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('Almacenamiento lleno'));
    await expect(saveNotificationsReadAt('s-1', '2026-10-20T10:00:00.000Z')).resolves.toBeUndefined();
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('stylist.notifications-read.s-1', '2026-10-20T10:00:00.000Z');
    await expect(saveNotificationsReadAt('s-1', '2026-10-20T10:00:00.000Z')).resolves.toBeUndefined();
  });
});
