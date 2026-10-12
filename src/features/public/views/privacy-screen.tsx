import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { gradients, palette } from '@/shared/theme/tokens';

import type { PublicPrivacyDocument } from '../models/public-content';
import { styles } from '../styles/privacy-screen.styles';

export type PrivacyScreenProps = {
  document?: PublicPrivacyDocument;
  errorMessage?: string;
  expandedSectionIds?: readonly string[];
  isDownloading?: boolean;
  isOpening?: boolean;
  onBack: () => void;
  onDownloadDocument: () => void;
  onGoHome: () => void;
  onRetry: () => void;
  onToggleSection: (sectionId: string) => void;
  onViewDocument: () => void;
  status: 'error' | 'loading' | 'ready' | 'unavailable';
};

export function PrivacyScreen({
  document,
  errorMessage,
  expandedSectionIds = [],
  isDownloading = false,
  isOpening = false,
  onBack,
  onDownloadDocument,
  onGoHome,
  onRetry,
  onToggleSection,
  onViewDocument,
  status,
}: PrivacyScreenProps) {
  const unavailable = status === 'unavailable' || (status === 'ready' && !document);
  const hasError = status === 'error';

  return (
    <LinearGradient colors={gradients.screen} style={styles.screen}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Volver"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onBack}
            style={styles.iconButton}>
            <Ionicons name="chevron-back" size={24} color={palette.text} />
          </Pressable>
          <Text accessibilityRole="header" style={styles.headerTitle}>
            Política de privacidad
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {status === 'loading' ? (
          <View accessibilityLabel="Cargando política de privacidad" style={styles.stateContainer}>
            <ActivityIndicator color={palette.primary} size="large" />
            <Text style={styles.stateTitle}>Cargando documento…</Text>
            <Text style={styles.stateDescription}>
              Estamos consultando la política de privacidad.
            </Text>
          </View>
        ) : hasError || unavailable ? (
          <View style={styles.stateContainer}>
            <View style={styles.warningIcon}>
              <Ionicons name="document-text-outline" size={38} color={palette.error} />
            </View>
            <Text style={styles.stateTag}>DOCUMENTO NO DISPONIBLE</Text>
            <Text accessibilityRole="header" style={styles.stateTitle}>
              No se pudo mostrar la política
            </Text>
            <Text accessibilityRole={hasError ? 'alert' : undefined} style={styles.stateDescription}>
              {errorMessage ??
                'El documento no está disponible en este momento. Intenta nuevamente más tarde.'}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={onRetry}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
              <Ionicons name="refresh" size={18} color={palette.white} />
              <Text style={styles.primaryButtonText}>Reintentar</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onGoHome}
              style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}>
              <Text style={styles.textButtonLabel}>Volver al inicio</Text>
            </Pressable>
          </View>
        ) : document ? (
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}>
            <View style={styles.intro}>
              <View style={styles.shieldIcon}>
                <Ionicons name="shield-checkmark-outline" size={28} color={palette.secondary} />
              </View>
              <View style={styles.introCopy}>
                <Text style={styles.introTitle}>Tu información es importante</Text>
                <Text style={styles.introText}>
                  Consulta cómo protegemos tus datos personales y los derechos relacionados con su uso.
                </Text>
              </View>
            </View>

            <View style={styles.documentCard}>
              <View style={styles.documentHeading}>
                <View style={styles.pdfIcon}>
                  <Ionicons name="document-text" size={26} color={palette.primary} />
                </View>
                <View style={styles.documentCopy}>
                  <Text numberOfLines={2} style={styles.documentName}>
                    {document.fileName}
                  </Text>
                  <View style={styles.documentMetadata}>
                    <Text style={styles.metadataText}>{document.fileType}</Text>
                    {document.fileSizeText ? (
                      <>
                        <Text accessibilityElementsHidden style={styles.metadataDot}>•</Text>
                        <Text style={styles.metadataText}>{document.fileSizeText}</Text>
                      </>
                    ) : null}
                  </View>
                </View>
              </View>

              <View style={styles.documentActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ busy: isOpening, disabled: isOpening }}
                  disabled={isOpening}
                  onPress={onViewDocument}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    styles.documentButton,
                    isOpening && styles.disabled,
                    pressed && styles.pressed,
                  ]}>
                  {isOpening ? (
                    <ActivityIndicator color={palette.white} size="small" />
                  ) : (
                    <Ionicons name="eye-outline" size={18} color={palette.white} />
                  )}
                  <Text style={styles.primaryButtonText}>
                    {isOpening ? 'Abriendo…' : 'Ver documento'}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ busy: isDownloading, disabled: isDownloading }}
                  disabled={isDownloading}
                  onPress={onDownloadDocument}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    styles.documentButton,
                    isDownloading && styles.disabled,
                    pressed && styles.pressed,
                  ]}>
                  {isDownloading ? (
                    <ActivityIndicator color={palette.secondary} size="small" />
                  ) : (
                    <Ionicons name="download-outline" size={18} color={palette.secondary} />
                  )}
                  <Text style={styles.secondaryButtonText}>
                    {isDownloading ? 'Descargando…' : 'Descargar'}
                  </Text>
                </Pressable>
              </View>
            </View>

            {document.summarySections?.length ? (
              <View style={styles.summary}>
                <Text accessibilityRole="header" style={styles.sectionTitle}>
                  Resumen del contenido
                </Text>
                <View style={styles.accordionList}>
                  {document.summarySections.map((section) => {
                    const expanded = expandedSectionIds.includes(section.id);

                    return (
                      <View key={section.id} style={styles.accordion}>
                        <Pressable
                          accessibilityLabel={section.title}
                          accessibilityRole="button"
                          accessibilityState={{ expanded }}
                          onPress={() => onToggleSection(section.id)}
                          style={({ pressed }) => [
                            styles.accordionHeader,
                            pressed && styles.pressed,
                          ]}>
                          <Text style={styles.accordionTitle}>{section.title}</Text>
                          <Ionicons
                            name={expanded ? 'chevron-up' : 'chevron-down'}
                            size={18}
                            color={palette.textMuted}
                          />
                        </Pressable>
                        {expanded ? (
                          <Text style={styles.accordionContent}>{section.content}</Text>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {document.lastUpdatedText ? (
              <Text style={styles.lastUpdated}>
                Última actualización: {document.lastUpdatedText}
              </Text>
            ) : null}
          </ScrollView>
        ) : null}
      </SafeAreaView>
    </LinearGradient>
  );
}
