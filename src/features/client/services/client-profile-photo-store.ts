import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type {
  ClientProfilePhoto,
  ClientProfilePhotoSelection,
} from '@/features/client/models/client-profile-photo';

const PROFILE_PHOTO_DIRECTORY = 'client-profile-photos';
const PROFILE_PHOTO_STORAGE_PREFIX = 'estetica-panamericana.client-profile-photo.v1';
const memoryPhotos = new Map<string, ClientProfilePhoto | null>();

export class ClientProfilePhotoStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClientProfilePhotoStorageError';
  }
}

function normalizedUserId(userId: string) {
  const value = userId.trim();
  if (!value) {
    throw new ClientProfilePhotoStorageError('No se pudo identificar al cliente.');
  }
  return value;
}

function safeUserId(userId: string) {
  return normalizedUserId(userId).replace(/[^a-zA-Z0-9._-]/g, '_');
}

function storageKey(userId: string) {
  return `${PROFILE_PHOTO_STORAGE_PREFIX}.${safeUserId(userId)}`;
}

function isStoredPhoto(value: unknown, userId: string): value is ClientProfilePhoto {
  if (!value || typeof value !== 'object') return false;
  const photo = value as Partial<ClientProfilePhoto>;
  return (
    photo.userId === userId &&
    typeof photo.uri === 'string' &&
    photo.uri.length > 0 &&
    typeof photo.updatedAt === 'string'
  );
}

function normalizedExtension(extension: string) {
  const value = extension.trim().toLowerCase();
  return ['heic', 'heif', 'jpg', 'png', 'webp'].includes(value) ? value : 'jpg';
}

async function removeStoredMetadata(userId: string) {
  await SecureStore.deleteItemAsync(storageKey(userId));
  memoryPhotos.set(userId, null);
}

export async function getClientProfilePhoto(userId: string) {
  const id = normalizedUserId(userId);
  if (memoryPhotos.has(id)) return memoryPhotos.get(id) ?? null;
  if (Platform.OS === 'web') return null;

  try {
    const storedValue = await SecureStore.getItemAsync(storageKey(id));
    if (!storedValue) {
      memoryPhotos.set(id, null);
      return null;
    }

    const parsed: unknown = JSON.parse(storedValue);
    if (!isStoredPhoto(parsed, id)) {
      await removeStoredMetadata(id);
      return null;
    }

    const { Directory, File, Paths } = await import('expo-file-system');
    const directory = new Directory(Paths.document, PROFILE_PHOTO_DIRECTORY, safeUserId(id));
    const directoryPrefix = directory.uri.endsWith('/') ? directory.uri : `${directory.uri}/`;
    const storedFile = new File(parsed.uri);
    if (!parsed.uri.startsWith(directoryPrefix) || !storedFile.exists) {
      await removeStoredMetadata(id);
      if (directory.exists) directory.delete();
      return null;
    }

    // Limpia copias que una interrupción anterior pudiera haber dejado huérfanas.
    try {
      for (const item of directory.list()) {
        if (item.uri === storedFile.uri) continue;
        try {
          item.delete();
        } catch {
          // La foto vigente sigue siendo válida; se volverá a intentar en la próxima lectura.
        }
      }
    } catch {
      // La lectura del directorio no debe ocultar la foto vigente.
    }

    memoryPhotos.set(id, parsed);
    return { ...parsed };
  } catch {
    throw new ClientProfilePhotoStorageError('No se pudo recuperar la foto guardada.');
  }
}

export async function saveClientProfilePhoto(
  userId: string,
  selection: ClientProfilePhotoSelection,
) {
  const id = normalizedUserId(userId);
  const normalizedUri = selection.uri.trim();
  if (!normalizedUri) {
    throw new ClientProfilePhotoStorageError('La imagen seleccionada no es válida.');
  }

  if (Platform.OS === 'web') {
    const webPhoto: ClientProfilePhoto = {
      updatedAt: new Date().toISOString(),
      uri: normalizedUri,
      userId: id,
    };
    memoryPhotos.set(id, webPhoto);
    return { ...webPhoto };
  }

  let destinationUri = '';
  try {
    const { Directory, File, Paths } = await import('expo-file-system');
    const directory = new Directory(Paths.document, PROFILE_PHOTO_DIRECTORY, safeUserId(id));
    directory.create({ idempotent: true, intermediates: true });

    const suffix = Math.random().toString(36).slice(2, 8);
    const destination = new File(
      directory,
      `profile-${Date.now()}-${suffix}.${normalizedExtension(selection.extension)}`,
    );
    destinationUri = destination.uri;
    await new File(normalizedUri).copy(destination);

    const photo: ClientProfilePhoto = {
      updatedAt: new Date().toISOString(),
      uri: destination.uri,
      userId: id,
    };
    await SecureStore.setItemAsync(storageKey(id), JSON.stringify(photo), {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });

    // La nueva referencia ya es válida; ahora se pueden borrar versiones anteriores.
    try {
      for (const item of directory.list()) {
        if (item.uri === destination.uri) continue;
        try {
          item.delete();
        } catch {
          // No invalida la nueva foto; la próxima lectura vuelve a limpiar versiones anteriores.
        }
      }
    } catch {
      // No invalida la nueva foto; la próxima lectura vuelve a limpiar versiones anteriores.
    }
    memoryPhotos.set(id, photo);
    return { ...photo };
  } catch {
    if (destinationUri) {
      try {
        const { File } = await import('expo-file-system');
        const incompleteFile = new File(destinationUri);
        if (incompleteFile.exists) incompleteFile.delete();
      } catch {
        // La próxima lectura limpia cualquier copia incompleta dentro del directorio administrado.
      }
    }
    throw new ClientProfilePhotoStorageError('No se pudo guardar la foto en este dispositivo.');
  }
}

export async function removeClientProfilePhoto(userId: string) {
  const id = normalizedUserId(userId);
  if (Platform.OS === 'web') {
    memoryPhotos.set(id, null);
    return;
  }

  try {
    const { Directory, Paths } = await import('expo-file-system');
    const directory = new Directory(Paths.document, PROFILE_PHOTO_DIRECTORY, safeUserId(id));
    if (directory.exists) directory.delete();
    await removeStoredMetadata(id);
  } catch {
    throw new ClientProfilePhotoStorageError('No se pudo eliminar la foto guardada.');
  }
}
