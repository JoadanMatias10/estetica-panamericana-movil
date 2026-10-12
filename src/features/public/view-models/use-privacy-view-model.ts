import * as WebBrowser from 'expo-web-browser';
import { useCallback, useState } from 'react';
import { Linking } from 'react-native';

import type { PublicPrivacyDocument } from '../models/public-content';
import { getCompanyInformation } from '../services/public-api-service';
import { usePublicApiResource } from './use-public-api-resource';

function secureDocumentUrl(value?: string) {
  return value && /^https:\/\/[^\s]+$/i.test(value) ? value : undefined;
}

function readableFileType(mimeType: string, fileName: string) {
  if (/pdf/i.test(mimeType) || /\.pdf$/i.test(fileName)) return 'PDF';
  if (mimeType.trim()) return mimeType.trim();
  return 'Documento';
}

export function usePrivacyViewModel() {
  const resource = usePublicApiResource(getCompanyInformation);
  const [expandedSectionIds, setExpandedSectionIds] = useState<string[]>([]);
  const [isOpening, setIsOpening] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [actionError, setActionError] = useState<string>();
  const privacy = resource.data?.privacyDocument;
  const documentUrl = secureDocumentUrl(privacy?.url);
  const document: PublicPrivacyDocument | undefined = documentUrl ? {
    fileName: privacy?.name || 'Política de privacidad',
    fileType: readableFileType(privacy?.mimeType || '', privacy?.name || ''),
  } : undefined;

  const onViewDocument = useCallback(async () => {
    if (!documentUrl || isOpening) return;
    setActionError(undefined);
    setIsOpening(true);
    try {
      await WebBrowser.openBrowserAsync(documentUrl);
    } catch {
      setActionError('No se pudo abrir el documento. Inténtalo nuevamente.');
    } finally {
      setIsOpening(false);
    }
  }, [documentUrl, isOpening]);

  const onDownloadDocument = useCallback(async () => {
    if (!documentUrl || isDownloading) return;
    setActionError(undefined);
    setIsDownloading(true);
    try {
      await Linking.openURL(documentUrl);
    } catch {
      setActionError('No se pudo abrir la descarga. Inténtalo nuevamente.');
    } finally {
      setIsDownloading(false);
    }
  }, [documentUrl, isDownloading]);

  const status = resource.isLoading && !resource.data
    ? 'loading'
    : resource.error && !resource.data
      ? 'error'
      : document
        ? 'ready'
        : 'unavailable';

  return {
    document,
    errorMessage: actionError || resource.error,
    expandedSectionIds,
    isDownloading,
    isOpening,
    status: status as 'error' | 'loading' | 'ready' | 'unavailable',
    onDownloadDocument: () => { void onDownloadDocument(); },
    onRetry: resource.onRetry,
    onToggleSection: (sectionId: string) => {
      setExpandedSectionIds((current) => current.includes(sectionId)
        ? current.filter((id) => id !== sectionId)
        : [...current, sectionId]);
    },
    onViewDocument: () => { void onViewDocument(); },
  };
}
