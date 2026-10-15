import type { ImagePickerAsset, ImagePickerOptions } from 'expo-image-picker';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

export type ClientImagePickerErrorCode =
  | 'native-module-missing'
  | 'open-failed'
  | 'permission-denied';

export class ClientImagePickerError extends Error {
  readonly code: ClientImagePickerErrorCode;

  constructor(code: ClientImagePickerErrorCode, message: string) {
    super(message);
    this.name = 'ClientImagePickerError';
    this.code = code;
  }
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return `${error.name} ${error.message}`.toLowerCase();
  return String(error ?? '').toLowerCase();
}

function isMissingNativeModule(error: unknown) {
  const message = errorMessage(error);
  return (
    message.includes('exponentimagepicker') ||
    message.includes('expoimagepicker') ||
    message.includes('native module') ||
    message.includes('native-module') ||
    message.includes('cannot find module') ||
    message.includes('module is not registered')
  );
}

function pickerError(error: unknown): ClientImagePickerError {
  if (error instanceof ClientImagePickerError) return error;
  if (isMissingNativeModule(error)) {
    return new ClientImagePickerError(
      'native-module-missing',
      'Esta Development Build no incluye el selector de imágenes. Genera e instala una nueva build para abrir la galería.',
    );
  }
  return new ClientImagePickerError(
    'open-failed',
    'No se pudo abrir la galería. Revisa el permiso de fotos e intenta nuevamente.',
  );
}

function assertImagePickerIsIncluded() {
  if (
    Platform.OS !== 'web' &&
    !requireOptionalNativeModule('ExponentImagePicker')
  ) {
    throw new ClientImagePickerError(
      'native-module-missing',
      'Esta Development Build no incluye el selector de imágenes. Instala la nueva build para abrir la galería.',
    );
  }
}

async function launchPicker(
  ImagePicker: typeof import('expo-image-picker'),
  options: ImagePickerOptions,
) {
  try {
    return await ImagePicker.launchImageLibraryAsync(options);
  } catch (error) {
    if (isMissingNativeModule(error) || Platform.OS !== 'android') throw error;

    const currentPermission = await ImagePicker.getMediaLibraryPermissionsAsync();
    const permission = currentPermission.granted
      ? currentPermission
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      throw new ClientImagePickerError(
        'permission-denied',
        permission.canAskAgain
          ? 'Necesitamos permiso para acceder a tus fotos.'
          : 'El permiso de fotos está desactivado. Habilítalo desde los ajustes del teléfono.',
      );
    }

    // Algunos proveedores de archivos de Android solo responden al selector heredado.
    return ImagePicker.launchImageLibraryAsync({ ...options, legacy: true });
  }
}

async function requestIosPermission(ImagePicker: typeof import('expo-image-picker')) {
  if (Platform.OS !== 'ios') return;

  const currentPermission = await ImagePicker.getMediaLibraryPermissionsAsync();
  const permission = currentPermission.granted
    ? currentPermission
    : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new ClientImagePickerError(
      'permission-denied',
      permission.canAskAgain
        ? 'Necesitamos permiso para acceder a tus fotos.'
        : 'El permiso de fotos está desactivado. Habilítalo desde los ajustes del teléfono.',
    );
  }
}

export async function pickClientImage(
  options: Omit<ImagePickerOptions, 'mediaTypes'> = {},
): Promise<ImagePickerAsset | null> {
  try {
    // Evita evaluar expo-image-picker cuando el APK instalado todavía no contiene su módulo nativo.
    assertImagePickerIsIncluded();
    const ImagePicker = await import('expo-image-picker');
    await requestIosPermission(ImagePicker);

    const result = await launchPicker(ImagePicker, {
      allowsEditing: false,
      mediaTypes: ['images'],
      quality: 0.85,
      ...options,
    });

    if (result.canceled || !result.assets[0]) return null;
    return result.assets[0];
  } catch (error) {
    throw pickerError(error);
  }
}
