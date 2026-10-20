import type { ImagePickerAsset } from 'expo-image-picker';

import type { ClientPaymentProof } from '@/features/client/models/client-payment';
import { pickClientImage } from '@/features/client/services/client-image-picker';

const FIVE_MEGABYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export class ClientPaymentProofPickerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClientPaymentProofPickerError';
  }
}

function assetMimeType(asset: ImagePickerAsset) {
  const mimeType = asset.mimeType?.toLowerCase() || '';
  if (mimeType) return mimeType;

  const fileName = (asset.fileName || asset.uri).toLowerCase().split(/[?#]/)[0];
  if (fileName.endsWith('.png')) return 'image/png';
  if (fileName.endsWith('.webp')) return 'image/webp';
  if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) return 'image/jpeg';
  return '';
}

function proofFromAsset(asset: ImagePickerAsset): ClientPaymentProof {
  const mimeType = assetMimeType(asset);
  if ((asset.fileSize ?? 0) > FIVE_MEGABYTES || !ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new ClientPaymentProofPickerError(
      'El comprobante debe ser JPG, PNG o WEBP y pesar máximo 5 MB.',
    );
  }

  const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
  return {
    ...(asset.file ? { file: asset.file } : {}),
    mimeType,
    name: asset.fileName || `comprobante.${extension}`,
    uri: asset.uri,
  };
}

export async function pickClientPaymentProof(): Promise<ClientPaymentProof | null> {
  try {
    const asset = await pickClientImage({
      allowsEditing: false,
      quality: 0.8,
    });

    if (!asset) return null;
    return proofFromAsset(asset);
  } catch (error) {
    if (error instanceof ClientPaymentProofPickerError) throw error;
    throw new ClientPaymentProofPickerError(
      error instanceof Error
        ? error.message
        : 'No se pudo abrir la galería. Intenta nuevamente.',
    );
  }
}
