import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { gradients, palette } from '@/shared/theme/tokens';

import type { PublicPromotion } from '../models/public-content';
import { styles } from '../styles/promotions-screen.styles';

export type PromotionsScreenProps = {
  errorMessage?: string;
  isSharingId?: string;
  onRetry: () => void;
  onShare: (promotion: PublicPromotion) => void;
  onViewServices: () => void;
  promotions: readonly PublicPromotion[];
  shareError?: string;
  status: 'error' | 'loading' | 'ready';
};

export function PromotionsScreen({
  errorMessage,
  isSharingId,
  onRetry,
  onShare,
  onViewServices,
  promotions,
  shareError,
  status,
}: PromotionsScreenProps) {
  const isEmpty = status === 'ready' && promotions.length === 0;

  return (
    <LinearGradient colors={gradients.screen} style={styles.screen}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          <View style={styles.heading}>
            <Text accessibilityRole="header" style={styles.title}>
              Promociones
            </Text>
            <Text style={styles.subtitle}>
              Consulta las ofertas disponibles en Estética Panamericana.
            </Text>
          </View>

          {shareError ? (
            <View accessibilityRole="alert" style={styles.inlineError}>
              <Ionicons name="alert-circle-outline" size={18} color={palette.error} />
              <Text style={styles.inlineErrorText}>{shareError}</Text>
            </View>
          ) : null}

          {status === 'loading' ? (
            <View accessibilityLabel="Cargando promociones" style={styles.stateContainer}>
              <ActivityIndicator color={palette.primary} size="large" />
              <Text style={styles.stateTitle}>Cargando promociones…</Text>
            </View>
          ) : status === 'error' ? (
            <View style={styles.stateContainer}>
              <View style={styles.stateIcon}>
                <Ionicons name="cloud-offline-outline" size={38} color={palette.error} />
              </View>
              <Text accessibilityRole="header" style={styles.stateTitle}>
                No se pudieron cargar las promociones
              </Text>
              <Text accessibilityRole="alert" style={styles.stateDescription}>
                {errorMessage ?? 'Intenta nuevamente para consultar las ofertas disponibles.'}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={onRetry}
                style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
                <Ionicons name="refresh" size={18} color={palette.white} />
                <Text style={styles.primaryButtonText}>Reintentar</Text>
              </Pressable>
            </View>
          ) : isEmpty ? (
            <View style={styles.stateContainer}>
              <View style={styles.emptyGift}>
                <Ionicons name="gift-outline" size={42} color={palette.secondary} />
              </View>
              <Text accessibilityRole="header" style={styles.stateTitle}>
                No hay promociones disponibles
              </Text>
              <Text style={styles.stateDescription}>
                Por el momento no hay ofertas activas. Puedes consultar nuestros servicios disponibles.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={onViewServices}
                style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
                <Text style={styles.primaryButtonText}>Ver servicios</Text>
                <Ionicons name="arrow-forward" size={18} color={palette.white} />
              </Pressable>
            </View>
          ) : (
            <View accessibilityRole="list" style={styles.list}>
              {promotions.map((promotion, index) => {
                const isSharing = isSharingId === promotion.id;

                return (
                  <View key={promotion.id} style={styles.card}>
                    <LinearGradient
                      colors={index % 2 === 0 ? ['#FCE7F3', '#EDE9FE'] : ['#EDE9FE', '#FCE7F3']}
                      end={{ x: 1, y: 1 }}
                      start={{ x: 0, y: 0 }}
                      style={styles.cardVisual}>
                      <View style={styles.promotionBadge}>
                        <Ionicons name="sparkles" size={13} color={palette.primary} />
                        <Text style={styles.promotionBadgeText}>PROMOCIÓN</Text>
                      </View>
                      <Ionicons name="gift-outline" size={48} color={palette.secondary} />
                      {promotion.discount ? (
                        <Text style={styles.discount}>{promotion.discount}</Text>
                      ) : null}
                    </LinearGradient>

                    <View style={styles.cardBody}>
                      <Text accessibilityRole="header" style={styles.cardTitle}>
                        {promotion.title}
                      </Text>
                      {promotion.description ? (
                        <Text style={styles.cardDescription}>{promotion.description}</Text>
                      ) : null}
                      <View style={styles.cardActions}>
                        <Pressable
                          accessibilityLabel={`Ver servicios de ${promotion.title}`}
                          accessibilityRole="button"
                          onPress={onViewServices}
                          style={({ pressed }) => [styles.servicesButton, pressed && styles.pressed]}>
                          <Text style={styles.servicesButtonText}>Ver servicios</Text>
                          <Ionicons name="chevron-forward" size={16} color={palette.secondary} />
                        </Pressable>
                        <Pressable
                          accessibilityLabel={`Compartir ${promotion.title}`}
                          accessibilityRole="button"
                          accessibilityState={{ busy: isSharing, disabled: isSharing }}
                          disabled={isSharing}
                          onPress={() => onShare(promotion)}
                          style={({ pressed }) => [
                            styles.shareButton,
                            isSharing && styles.disabled,
                            pressed && styles.pressed,
                          ]}>
                          {isSharing ? (
                            <ActivityIndicator color={palette.primary} size="small" />
                          ) : (
                            <Ionicons name="share-social-outline" size={19} color={palette.primary} />
                          )}
                        </Pressable>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
