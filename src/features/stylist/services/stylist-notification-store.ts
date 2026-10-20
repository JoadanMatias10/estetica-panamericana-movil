import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// The API exposes appointment activity, but does not have a read-receipt endpoint.
// Keep only a timestamp per account on this device; never cache client details here.
const keyFor = (userId: string) => `stylist.notifications-read.${userId.replace(/[^a-zA-Z0-9_.-]/g, '')}`;

export async function getNotificationsReadAt(userId: string) {
  try {
    const value = Platform.OS === 'web'
      ? (typeof localStorage !== 'undefined' ? localStorage.getItem(keyFor(userId)) : null)
      : await SecureStore.getItemAsync(keyFor(userId));
    return value && Number.isFinite(new Date(value).getTime()) ? new Date(value).toISOString() : '';
  } catch {
    return '';
  }
}

export async function saveNotificationsReadAt(userId: string, value: string) {
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.setItem(keyFor(userId), value);
    } else {
      await SecureStore.setItemAsync(keyFor(userId), value);
    }
  } catch {
    // The read marker still remains active for the current session.
  }
}
