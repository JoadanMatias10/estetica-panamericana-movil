import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState, Linking } from 'react-native';

import { createPublicContact, getOpeningStatus } from '../models/public-contact';
import { getCompanyInformation } from '../services/public-api-service';
import { usePublicApiResource } from './use-public-api-resource';

function digitsOnly(value?: string) {
  const digits = value?.replace(/\D/g, '');
  return digits && digits.length >= 8 && digits.length <= 15 ? digits : undefined;
}

function mexicanWhatsAppNumber(value?: string) {
  const digits = digitsOnly(value);
  if (!digits) return undefined;
  return digits.length === 10 ? `52${digits}` : digits;
}

function secureUrl(value?: string) {
  return value && /^https:\/\/[^\s]+$/i.test(value) ? value : undefined;
}

export function useContactViewModel() {
  const resource = usePublicApiResource(getCompanyInformation);
  const [now, setNow] = useState(() => new Date());
  const [actionError, setActionError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const contact = useMemo(
    () => resource.data ? createPublicContact(resource.data) : { schedule: [] },
    [resource.data],
  );

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setNow(new Date());
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, []);

  const phone = digitsOnly(contact.phone);
  const whatsApp = mexicanWhatsAppNumber(contact.whatsApp);
  const email = contact.email?.trim();
  const coordinates = contact.coordinates;
  const validCoordinates = coordinates && Number.isFinite(coordinates.latitude) &&
    Number.isFinite(coordinates.longitude) && Math.abs(coordinates.latitude) <= 90 &&
    Math.abs(coordinates.longitude) <= 180;
  const directions = secureUrl(contact.directionsUrl) ??
    (validCoordinates
      ? `https://www.google.com/maps/dir/?api=1&destination=${coordinates.latitude},${coordinates.longitude}`
      : contact.address?.trim()
        ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(contact.address.trim())}`
        : undefined);
  const urls = {
    directions,
    call: phone ? `tel:${phone}` : undefined,
    whatsApp: whatsApp ? `https://wa.me/${whatsApp}` : undefined,
    email: email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? `mailto:${email}` : undefined,
  };

  const open = useCallback(async (url?: string) => {
    if (!url || busy) return;
    setBusy(true);
    setActionError(undefined);
    try {
      await Linking.openURL(url);
    } catch {
      setActionError('No se pudo abrir el enlace. Verifica que tengas una aplicación compatible.');
    } finally {
      setBusy(false);
    }
  }, [busy]);

  return {
    ...resource,
    businessName: resource.data?.name || 'Estética Panamericana',
    address: contact.address,
    locationReference: contact.locationReference,
    mapImage: contact.mapImage,
    schedule: contact.schedule,
    isOpen: getOpeningStatus(contact, now),
    actionError,
    canDirections: Boolean(urls.directions) && !busy,
    canCall: Boolean(urls.call) && !busy,
    canWhatsApp: Boolean(urls.whatsApp) && !busy,
    canEmail: Boolean(urls.email) && !busy,
    onDirections: () => { void open(urls.directions); },
    onCall: () => { void open(urls.call); },
    onWhatsApp: () => { void open(urls.whatsApp); },
    onEmail: () => { void open(urls.email); },
  };
}
