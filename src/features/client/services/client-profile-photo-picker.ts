import type { ClientProfilePhotoSelection } from '@/features/client/models/client-profile-photo';
import { pickClientImage } from '@/features/client/services/client-image-picker';

const MAX_PROFILE_PHOTO_SIZE = 10 * 1024 * 1024;

export class ClientProfilePhotoPickerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClientProfilePhotoPickerError';
  }
}

function imageExtension(fileName: string | null | undefined, mimeType: string | null | undefined) {
  const normalizedMimeType = mimeType?.toLowerCase() || '';
  if (normalizedMimeType === 'image/png') return 'png';
  if (normalizedMimeType === 'image/webp') return 'webp';
  if (normalizedMimeType === 'image/heic') return 'heic';
  if (normalizedMimeType === 'image/heif') return 'heif';
  if (normalizedMimeType === 'image/jpeg') return 'jpg';

  const extension = fileName?.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  return extension && ['heic', 'heif', 'jpeg', 'jpg', 'png', 'webp'].includes(extension)
    ? extension === 'jpeg' ? 'jpg' : extension
    : 'jpg';
}

export async function pickClientProfilePhoto(): Promise<ClientProfilePhotoSelection | null> {
  try {
    const asset = await pickClientImage({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.75,
    });

    if (!asset) return null;
    if ((asset.fileSize ?? 0) > MAX_PROFILE_PHOTO_SIZE) {
      throw new ClientProfilePhotoPickerError('La foto debe pesar máximo 10 MB.');
    }
    return {
      extension: imageExtension(asset.fileName, asset.mimeType),
      uri: asset.uri,
    };
  } catch (error) {
    if (error instanceof ClientProfilePhotoPickerError) throw error;
    throw new ClientProfilePhotoPickerError(
      error instanceof Error ? error.message : 'No se pudo seleccionar la foto.',
    );
  }
}
