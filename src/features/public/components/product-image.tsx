import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { View, type ImageStyle, type StyleProp } from 'react-native';
import { palette } from '@/shared/theme/tokens';
import type { ProductImage as ProductImageSource } from '../models/public-product';
import { styles } from '../styles/products-screen.styles';

function remoteImageUri(source?: ProductImageSource) {
  if (!source || typeof source === 'number' || Array.isArray(source)) return '';
  return typeof source.uri === 'string' ? source.uri.trim() : '';
}

export function ProductImage({ source, label, style }: {
  source?: ProductImageSource; label: string; style: StyleProp<ImageStyle>;
}) {
  const uri = remoteImageUri(source);
  const [failedSource, setFailedSource] = useState<ProductImageSource>();
  if (!uri || failedSource === source) return <View style={[style, styles.imageFallback]} accessibilityLabel="Imagen pendiente">
    <Ionicons name="bag-outline" size={36} color={palette.secondaryBright} />
  </View>;
  return <Image
    accessibilityLabel={label}
    cachePolicy="memory-disk"
    contentFit="contain"
    onError={() => setFailedSource(source)}
    recyclingKey={uri}
    source={{ uri }}
    style={style}
    transition={150}
  />;
}
