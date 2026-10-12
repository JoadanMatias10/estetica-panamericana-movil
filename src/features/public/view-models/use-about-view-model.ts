import { useCallback, useState } from 'react';
import { Linking } from 'react-native';

import { getCompanyInformation } from '../services/public-api-service';
import { usePublicApiResource } from './use-public-api-resource';

function isSecureUrl(value?: string) {
  return Boolean(value && /^https:\/\/[^\s]+$/i.test(value));
}

export function useAboutViewModel() {
  const resource = usePublicApiResource(getCompanyInformation);
  const [actionError, setActionError] = useState<string>();
  const [isOpeningLink, setIsOpeningLink] = useState(false);
  const company = resource.data;

  const openLink = useCallback(async (url?: string) => {
    if (!isSecureUrl(url) || isOpeningLink) return;

    setIsOpeningLink(true);
    setActionError(undefined);
    try {
      await Linking.openURL(url!);
    } catch {
      setActionError('No se pudo abrir el enlace. Verifica que tengas una aplicación compatible.');
    } finally {
      setIsOpeningLink(false);
    }
  }, [isOpeningLink]);

  return {
    ...resource,
    actionError,
    businessName: company?.name || 'Estética Panamericana',
    canOpenFacebook: isSecureUrl(company?.facebookUrl) && !isOpeningLink,
    canOpenInstagram: isSecureUrl(company?.instagramUrl) && !isOpeningLink,
    essence: company?.essence ?? '',
    history: company?.aboutText ?? '',
    mission: company?.mission ?? '',
    vision: company?.vision ?? '',
    values: company?.values ?? [],
    onFacebook: () => {
      void openLink(company?.facebookUrl);
    },
    onInstagram: () => {
      void openLink(company?.instagramUrl);
    },
  };
}
