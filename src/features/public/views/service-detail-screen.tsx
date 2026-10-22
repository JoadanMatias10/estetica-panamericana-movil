import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { gradients, palette } from '@/shared/theme/tokens';

import type { PublicServiceDetail } from '../models/public-service';
import { styles } from '../styles/service-detail-screen.styles';

export type ServiceDetailScreenProps = {
  errorMessage?: string;
  isSharing?: boolean;
  onBack: () => void;
  onLogin: () => void;
  onRetry: () => void;
  onSelectImage: (index: number) => void;
  onShare: () => void;
  onViewServices: () => void;
  selectedImageIndex?: number;
  service?: PublicServiceDetail;
  shareError?: string;
  status: 'error' | 'loading' | 'not-found' | 'ready';
};

const priceFormatter = new Intl.NumberFormat('es-MX', {
  currency: 'MXN',
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: 'currency',
});

export function ServiceDetailScreen({
  errorMessage,
  isSharing = false,
  onBack,
  onLogin,
  onRetry,
  onSelectImage,
  onShare,
  onViewServices,
  selectedImageIndex = 0,
  service,
  shareError,
  status,
}: ServiceDetailScreenProps) {
  const isMissing = status === 'not-found' || (status === 'ready' && !service);

  if (status === 'loading' || status === 'error' || isMissing) {
    return (
      <LinearGradient colors={gradients.screen} style={styles.screen}>
        <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
          <View style={styles.stateHeader}>
            <Pressable
              accessibilityLabel="Volver"
              accessibilityRole="button"
              onPress={onBack}
              style={styles.iconButton}>
              <Ionicons name="chevron-back" size={24} color={palette.text} />
            </Pressable>
          </View>
          <View style={styles.stateContainer}>
            {status === 'loading' ? (
              <>
                <ActivityIndicator color={palette.primary} size="large" />
                <Text style={styles.stateTitle}>Cargando servicio…</Text>
              </>
            ) : status === 'error' ? (
              <>
                <View style={styles.errorIcon}>
                  <Ionicons name="cloud-offline-outline" size={38} color={palette.error} />
                </View>
                <Text accessibilityRole="header" style={styles.stateTitle}>
                  No se pudo cargar el servicio
                </Text>
                <Text accessibilityRole="alert" style={styles.stateDescription}>
                  {errorMessage ?? 'Intenta nuevamente para consultar la información del servicio.'}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={onRetry}
                  style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
                  <Ionicons name="refresh" size={18} color={palette.white} />
                  <Text style={styles.primaryButtonText}>Reintentar</Text>
                </Pressable>
              </>
            ) : (
              <>
                <View style={styles.missingIcon}>
                  <Ionicons name="search-outline" size={40} color={palette.secondary} />
                </View>
                <Text accessibilityRole="header" style={styles.stateTitle}>
                  Servicio no encontrado
                </Text>
                <Text style={styles.stateDescription}>
                  El servicio solicitado ya no está disponible o no forma parte del catálogo actual.
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={onViewServices}
                  style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
                  <Text style={styles.primaryButtonText}>Ver todos los servicios</Text>
                </Pressable>
              </>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!service) {
    return null;
  }

  const gallery = service.gallery?.length
    ? service.gallery
    : service.image
      ? [service.image]
      : [];
  const safeImageIndex = Math.min(Math.max(selectedImageIndex, 0), Math.max(gallery.length - 1, 0));
  const selectedImage = gallery[safeImageIndex];
  const category = service.subcategory ?? service.category ?? service.segment;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          {selectedImage ? (
            <Image
              accessibilityLabel={`Imagen de ${service.name}`}
              resizeMode="cover"
              source={selectedImage}
              style={styles.heroImage}
            />
          ) : (
            <LinearGradient colors={gradients.soft} style={styles.imageFallback}>
              <Ionicons name="sparkles-outline" size={48} color={palette.secondary} />
            </LinearGradient>
          )}

          <View style={styles.toolbar}>
            <Pressable
              accessibilityLabel="Volver al catálogo de servicios"
              accessibilityRole="button"
              onPress={onBack}
              style={styles.iconButton}>
              <Ionicons name="chevron-back" size={24} color={palette.text} />
            </Pressable>
            <Pressable
              accessibilityLabel="Compartir servicio"
              accessibilityRole="button"
              accessibilityState={{ busy: isSharing, disabled: isSharing }}
              disabled={isSharing}
              onPress={onShare}
              style={[styles.iconButton, isSharing && styles.disabled]}>
              {isSharing ? (
                <ActivityIndicator color={palette.primary} size="small" />
              ) : (
                <Ionicons name="share-social-outline" size={21} color={palette.text} />
              )}
            </Pressable>
          </View>

          {gallery.length > 1 ? (
            <View accessibilityRole="tablist" style={styles.galleryDots}>
              {gallery.map((_, index) => {
                const selected = index === safeImageIndex;

                return (
                  <Pressable
                    accessibilityLabel={`Mostrar imagen ${index + 1} de ${gallery.length}`}
                    accessibilityRole="tab"
                    accessibilityState={{ selected }}
                    key={`${service.id}-image-${index}`}
                    onPress={() => onSelectImage(index)}
                    style={styles.dotButton}>
                    <View style={[styles.dot, selected && styles.activeDot]} />
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          {shareError ? (
            <View accessibilityRole="alert" style={styles.inlineError}>
              <Ionicons name="alert-circle-outline" size={18} color={palette.error} />
              <Text style={styles.inlineErrorText}>{shareError}</Text>
            </View>
          ) : null}

          <View style={styles.metadata}>
            {category ? (
              <View style={styles.categoryTag}>
                <Text style={styles.categoryText}>{category}</Text>
              </View>
            ) : null}
            {service.durationText ? (
              <View style={styles.durationTag}>
                <Ionicons name="time-outline" size={15} color={palette.textMuted} />
                <Text style={styles.durationText}>{service.durationText}</Text>
              </View>
            ) : null}
          </View>

          <Text accessibilityRole="header" style={styles.name}>
            {service.name}
          </Text>

          {service.priceFrom !== undefined ? (
            <View style={styles.priceBlock}>
              <Text style={styles.priceLabel}>Desde</Text>
              <Text style={styles.price}>{priceFormatter.format(service.priceFrom)}</Text>
              <Text style={styles.priceCaption}>Precio inicial del servicio</Text>
            </View>
          ) : null}

          {service.description ? (
            <View style={styles.descriptionCard}>
              <Text accessibilityRole="header" style={styles.sectionTitle}>
                Descripción
              </Text>
              <Text style={styles.description}>{service.description}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerContent}>
          {service.priceFrom !== undefined ? (
            <View style={styles.footerPriceBlock}>
              <Text style={styles.footerLabel}>DESDE</Text>
              <Text style={styles.footerPrice}>{priceFormatter.format(service.priceFrom)}</Text>
            </View>
          ) : null}
          <Pressable
            accessibilityLabel={`Iniciar sesión para agendar ${service.name}`}
            accessibilityRole="button"
            onPress={onLogin}
            style={({ pressed }) => [styles.loginButton, pressed && styles.pressed]}>
            <LinearGradient
              colors={gradients.brand}
              end={{ x: 1, y: 0 }}
              start={{ x: 0, y: 0 }}
              style={styles.loginButtonFill}>
              <Ionicons name="calendar-outline" size={18} color={palette.white} />
              <Text style={styles.loginButtonText}>Iniciar sesión para agendar</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
