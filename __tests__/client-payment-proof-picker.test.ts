/// <reference types="jest" />
import type { ImagePickerAsset } from 'expo-image-picker';

import { pickClientImage } from '../src/features/client/services/client-image-picker';
import {
  ClientPaymentProofPickerError,
  pickClientPaymentProof,
} from '../src/features/client/services/client-payment-proof-picker';

jest.mock('../src/features/client/services/client-image-picker', () => ({ pickClientImage: jest.fn() }));

const asset = (value: Partial<ImagePickerAsset>): ImagePickerAsset => ({
  uri: 'file:///proof.jpg', width: 100, height: 100, ...value,
});

beforeEach(() => jest.clearAllMocks());

describe('selección y validación de comprobantes', () => {
  it('devuelve null si la persona cancela la galería', async () => {
    jest.mocked(pickClientImage).mockResolvedValue(null);
    await expect(pickClientPaymentProof()).resolves.toBeNull();
    expect(pickClientImage).toHaveBeenCalledWith({ allowsEditing: false, quality: 0.8 });
  });

  it('conserva un JPG válido con nombre y tipo declarados', async () => {
    jest.mocked(pickClientImage).mockResolvedValue(asset({ mimeType: 'IMAGE/JPEG', fileName: 'pago.jpg', fileSize: 1024 }));
    await expect(pickClientPaymentProof()).resolves.toEqual({
      uri: 'file:///proof.jpg', mimeType: 'image/jpeg', name: 'pago.jpg',
    });
  });

  it('deduce PNG y WEBP desde el archivo si no hay MIME', async () => {
    jest.mocked(pickClientImage).mockResolvedValueOnce(asset({ uri: 'file:///proof.PNG?cache=1' }))
      .mockResolvedValueOnce(asset({ uri: 'file:///proof.webp' }));
    await expect(pickClientPaymentProof()).resolves.toMatchObject({ mimeType: 'image/png', name: 'comprobante.png' });
    await expect(pickClientPaymentProof()).resolves.toMatchObject({ mimeType: 'image/webp', name: 'comprobante.webp' });
  });

  it('rechaza archivos de más de 5 MB', async () => {
    jest.mocked(pickClientImage).mockResolvedValue(asset({ fileSize: 5 * 1024 * 1024 + 1 }));
    await expect(pickClientPaymentProof()).rejects.toThrow(ClientPaymentProofPickerError);
    await expect(pickClientPaymentProof()).rejects.toThrow('máximo 5 MB');
  });

  it('rechaza extensiones y MIME no permitidos', async () => {
    jest.mocked(pickClientImage).mockResolvedValue(asset({ mimeType: 'application/pdf', fileName: 'pago.pdf' }));
    await expect(pickClientPaymentProof()).rejects.toThrow('JPG, PNG o WEBP');
  });

  it('convierte errores de galería a un error claro para la interfaz', async () => {
    jest.mocked(pickClientImage).mockRejectedValue(new Error('Permiso denegado'));
    await expect(pickClientPaymentProof()).rejects.toThrow('Permiso denegado');
  });
});
