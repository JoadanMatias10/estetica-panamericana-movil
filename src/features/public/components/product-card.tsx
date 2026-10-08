import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { palette } from '@/shared/theme/tokens';
import { formatProductPrice, productAvailability, type PublicProduct } from '../models/public-product';
import { styles } from '../styles/products-screen.styles';
import { ProductImage } from './product-image';

export const ProductCard = memo(function ProductCard({ product, maxWidth, onDetail }: {
  product: PublicProduct; maxWidth?: number; onDetail: (id: string) => void;
}) {
  const status = productAvailability(product.stock);
  const label = status === 'available' ? 'Disponible' : status === 'sold-out' ? 'Agotado' : 'Por confirmar';
  return <View style={[styles.card, maxWidth ? { maxWidth } : undefined]}>
    <Pressable style={styles.imageFrame} accessibilityRole="button" accessibilityLabel={`Ver detalle de ${product.name}`} onPress={() => onDetail(product.id)}>
      <ProductImage source={product.images[0]} label={`Referencia de ${product.name}`} style={styles.image} />
    </Pressable>
    <View style={styles.brandRow}>
      <Text style={styles.brand}>{product.brand}</Text>
      <View style={styles.status}>
        <View style={[styles.statusDot, status === 'sold-out' && styles.soldOutDot, status === 'unknown' && styles.unknownDot]} />
        <Text style={styles.statusText}>{label}</Text>
      </View>
    </View>
    <Text style={styles.name}>{product.name}</Text>
    {!!product.presentation && <Text style={styles.presentation}>{product.presentation}</Text>}
    <View style={styles.priceRow}>
      <Text style={styles.price}>{formatProductPrice(product.price)}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`Ver detalle de ${product.name}`} onPress={() => onDetail(product.id)}
        style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
        <Text style={styles.linkText}>Ver detalle</Text><Ionicons name="chevron-forward" size={12} color={palette.secondary} />
      </Pressable>
    </View>
  </View>;
});
