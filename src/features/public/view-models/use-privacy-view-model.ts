import * as WebBrowser from 'expo-web-browser';
import { useCallback, useRef, useState } from 'react';

import policyContent from '../data/privacy-policy.json';
import type { PrivacyPolicy } from '../models/privacy-policy';
import { PUBLIC_API_BASE_URL } from '../services/public-api-service';

const policy: PrivacyPolicy = policyContent;
export const PRIVACY_POLICY_URL = PUBLIC_API_BASE_URL + '/public/privacy-policy';

export function usePrivacyViewModel() {
  const opening = useRef(false);
  const [isOpening, setIsOpening] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  const onOpenWebsite = useCallback(async () => {
    if (opening.current) return;
    opening.current = true;
    setIsOpening(true);
    setErrorMessage(undefined);
    try {
      await WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL);
    } catch {
      setErrorMessage('No se pudo abrir la página. Puedes seguir leyendo la política aquí e intentarlo nuevamente.');
    } finally {
      opening.current = false;
      setIsOpening(false);
    }
  }, []);

  return { policy, isOpening, errorMessage, onOpenWebsite: () => { void onOpenWebsite(); } };
}
