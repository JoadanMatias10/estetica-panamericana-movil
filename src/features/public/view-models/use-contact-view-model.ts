import { useCallback, useEffect, useState } from 'react';
import { Alert, AppState, Linking } from 'react-native';
import { getOpeningStatus, publicContact, type PublicContact } from '../models/public-contact';

const phoneNumber = (value?: string) => {
  const normalized = value?.replace(/[\s()+.-]/g, '');
  return normalized && /^[1-9]\d{7,14}$/.test(normalized) ? normalized : undefined;
};

export function useContactViewModel(data: PublicContact = publicContact) {
  const [now, setNow] = useState(() => new Date());
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') setNow(new Date());
    });
    return () => { clearInterval(timer); subscription.remove(); };
  }, []);

  const phone = phoneNumber(data.phone);
  const whatsApp = phoneNumber(data.whatsApp);
  const email = data.email?.trim();
  const coordinates = data.coordinates;
  const validCoordinates = coordinates && Number.isFinite(coordinates.latitude) &&
    Number.isFinite(coordinates.longitude) && Math.abs(coordinates.latitude) <= 90 &&
    Math.abs(coordinates.longitude) <= 180;
  const directions = data.directionsUrl?.match(/^https:\/\/[^\s]+$/i) ? data.directionsUrl :
    validCoordinates ? `https://www.google.com/maps/dir/?api=1&destination=${coordinates.latitude},${coordinates.longitude}` :
      data.address?.trim() ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(data.address.trim())}` : undefined;
  const urls = {
    directions,
    call: phone ? `tel:+${phone}` : undefined,
    whatsApp: whatsApp ? `https://wa.me/${whatsApp}` : undefined,
    email: email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? `mailto:${encodeURIComponent(email)}` : undefined,
  };
  const open = useCallback(async (url?: string) => {
    if (!url || busy) return;
    setBusy(true);
    setError(undefined);
    try {
      await Linking.openURL(url);
    } catch {
      const message = 'No pudimos abrir el enlace. Verifica que tengas una aplicación compatible e inténtalo de nuevo.';
      setError(message);
      Alert.alert('No se pudo abrir', message);
    } finally { setBusy(false); }
  }, [busy]);

  return {
    address: data.address,
    locationReference: data.locationReference,
    mapImage: data.mapImage,
    schedule: data.schedule,
    isOpen: getOpeningStatus(data, now),
    error,
    canDirections: !!urls.directions && !busy,
    canCall: !!urls.call && !busy,
    canWhatsApp: !!urls.whatsApp && !busy,
    canEmail: !!urls.email && !busy,
    onDirections: () => { void open(urls.directions); },
    onCall: () => { void open(urls.call); },
    onWhatsApp: () => { void open(urls.whatsApp); },
    onEmail: () => { void open(urls.email); },
  };
}
