import { Ionicons } from '@expo/vector-icons';
import { memo, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { palette } from '@/shared/theme/tokens';
import { formatServiceDuration, formatServicePrice, type PublicService } from '../models/public-service';
import { styles } from '../styles/services-screen.styles';

type Props = {
  service: PublicService;
  category: string;
  compact: boolean;
  onDetail: (service: PublicService) => void;
};

export const ServiceCard = memo(function ServiceCard({ service, category, compact, onDetail }: Props) {
  const [failedImage, setFailedImage] = useState<PublicService['image']>();
  const imageStyle = [styles.image, compact && styles.imageCompact];
  return (
    <View style={styles.card}>
      {service.image && service.image !== failedImage ? (
        <Image source={service.image} style={imageStyle} resizeMode="cover"
          accessibilityLabel={`Referencia de ${service.name}`} onError={() => setFailedImage(service.image)} />
      ) : (
        <View style={[imageStyle, styles.imageFallback]}>
          <Ionicons name="sparkles-outline" size={28} color={palette.secondaryBright} />
        </View>
      )}
      <View style={styles.cardBody}>
        <View style={styles.categoryLabel}><Text style={styles.categoryText}>{category}</Text></View>
        <Text style={styles.serviceName}>{service.name}</Text>
        <View style={styles.metadata}>
          <Text style={styles.price}>Desde {formatServicePrice(service.priceFrom)}</Text>
          <View style={styles.duration}>
            <Ionicons name="time-outline" size={13} color={palette.textMuted} />
            <Text style={styles.durationText}>{formatServiceDuration(service)}</Text>
          </View>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={`Ver detalle de ${service.name}`}
          onPress={() => onDetail(service)} style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}>
          <Text style={styles.linkText}>Ver detalle</Text>
          <Ionicons name="chevron-forward" size={14} color={palette.secondary} />
        </Pressable>
      </View>
    </View>
  );
});
