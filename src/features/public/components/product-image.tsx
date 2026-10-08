import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, View, type ImageStyle, type StyleProp } from 'react-native';
import { palette } from '@/shared/theme/tokens';
import type { ProductImage as ProductImageSource } from '../models/public-product';
import { styles } from '../styles/products-screen.styles';

export function ProductImage({ source, label, style }: {
  source?: ProductImageSource; label: string; style: StyleProp<ImageStyle>;
}) {
  const [failed, setFailed] = useState<ProductImageSource>();
  if (!source || failed === source) return <View style={[style, styles.imageFallback]} accessibilityLabel="Imagen pendiente">
    <Ionicons name="bag-outline" size={36} color={palette.secondaryBright} />
  </View>;
  return <Image source={source} accessibilityLabel={label} style={style} resizeMode="contain" onError={() => setFailed(source)} />;
}
