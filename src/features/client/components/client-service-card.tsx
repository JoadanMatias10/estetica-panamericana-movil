import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { PublicService } from '@/features/public/models/public-service';
import { formatServiceDuration, formatServicePrice } from '@/features/public/models/public-service';
import { AppCard } from '@/shared/components/app-card';
import { AppText } from '@/shared/components/app-text';
import { palette, radius, spacing } from '@/shared/theme/tokens';

type ClientServiceCardProps = {
  category: string;
  onDetail: (service: PublicService) => void;
  onSchedule: (service: PublicService) => void;
  service: PublicService;
};

export function ClientServiceCard({ category, onDetail, onSchedule, service }: ClientServiceCardProps) {
  const [failedImage, setFailedImage] = useState<PublicService['image']>();

  return (
    <AppCard style={styles.card}>
      {service.image && failedImage !== service.image ? (
        <Image
          accessibilityLabel={`Imagen de ${service.name}`}
          cachePolicy="memory-disk"
          contentFit="cover"
          onError={() => setFailedImage(service.image)}
          recyclingKey={service.id}
          source={service.image}
          style={styles.image}
          transition={150}
        />
      ) : (
        <View style={[styles.image, styles.imageFallback]}>
          <Ionicons color={palette.secondaryBright} name="sparkles-outline" size={36} />
        </View>
      )}
      <View style={styles.copy}>
        <AppText style={styles.category} variant="caption">{category}</AppText>
        <Pressable accessibilityRole="button" onPress={() => onDetail(service)}>
          <AppText numberOfLines={2} style={styles.name} variant="label">{service.name}</AppText>
        </Pressable>
        <AppText numberOfLines={2} style={styles.description} tone="muted" variant="caption">
          {service.description || 'Consulta los detalles y la disponibilidad de este servicio.'}
        </AppText>
        <View style={styles.metadata}>
          <AppText style={styles.price} tone="primary" variant="label">Desde {formatServicePrice(service.priceFrom)}</AppText>
          <View style={styles.duration}>
            <Ionicons color={palette.textMuted} name="time-outline" size={13} />
            <AppText tone="muted" variant="caption">{formatServiceDuration(service)}</AppText>
          </View>
        </View>
        <View style={styles.actions}>
          <Pressable
            accessibilityLabel={`Ver detalle de ${service.name}`}
            accessibilityRole="button"
            onPress={() => onDetail(service)}
            style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
            <AppText style={styles.linkText} variant="caption">Ver detalle</AppText>
            <Ionicons color={palette.secondary} name="chevron-forward" size={14} />
          </Pressable>
          <Pressable
            accessibilityLabel={`Agendar ${service.name}`}
            accessibilityRole="button"
            onPress={() => onSchedule(service)}
            style={({ pressed }) => [styles.schedule, pressed && styles.pressed]}>
            <Ionicons color={palette.white} name="calendar-outline" size={14} />
            <AppText style={styles.scheduleText} variant="caption">Agendar</AppText>
          </Pressable>
        </View>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  card: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    overflow: 'hidden',
    padding: spacing.md,
  },
  category: {
    alignSelf: 'flex-start',
    backgroundColor: '#F5EAFE',
    borderRadius: radius.pill,
    color: palette.secondary,
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  description: {
    lineHeight: 17,
  },
  duration: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  image: {
    borderRadius: radius.sm,
    height: 116,
    width: 92,
  },
  imageFallback: {
    alignItems: 'center',
    backgroundColor: '#F8F0FF',
    justifyContent: 'center',
  },
  metadata: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'space-between',
  },
  name: {
    lineHeight: 19,
  },
  price: {
    fontSize: 13,
  },
  link: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 36,
  },
  linkText: {
    color: palette.secondary,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
  schedule: {
    alignItems: 'center',
    backgroundColor: palette.secondary,
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 36,
    paddingHorizontal: spacing.md,
  },
  scheduleText: {
    color: palette.white,
    fontWeight: '700',
  },
});
