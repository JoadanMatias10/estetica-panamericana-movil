import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette } from '@/shared/theme/tokens';
import { CatalogStatus } from '../components/catalog-status';
import { ProductGallery } from '../components/product-gallery';
import { formatProductPrice, type PublicProduct } from '../models/public-product';
import { styles } from '../styles/product-detail-screen.styles';

type Props = {
  product?: PublicProduct;
  availability: 'available' | 'sold-out' | 'unknown';
  isPreview: boolean;
  isLoading: boolean;
  error?: string;
  onRetry: () => void;
  quantity: number;
  canChangeQuantity: false;
  shareError?: string;
  isSharing: boolean;
  onShare: () => void;
  onBack: () => void;
  onLogin: () => void;
};

export function ProductDetailScreen({ product, availability, isPreview, isLoading, error, onRetry, quantity, canChangeQuantity,
  shareError, isSharing, onShare, onBack, onLogin }: Props) {
  if (!product) return <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
    <View style={styles.missing}>
      {isLoading ? <CatalogStatus kind="loading" title="Cargando producto…" />
        : error ? <CatalogStatus kind="error" title="No se pudo cargar el producto" message={error}
          actionLabel="Reintentar" onAction={onRetry} />
        : <CatalogStatus kind="empty" icon="bag-outline" title="Producto no encontrado"
          message="Este producto no está en el catálogo disponible." />}
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.iconButton} accessibilityLabel="Volver al catálogo">
        <Ionicons name="arrow-back" size={24} color={palette.text} />
      </Pressable>
    </View>
  </SafeAreaView>;
  const available = availability === 'available';
  const availabilityText = available ? 'Disponible' : availability === 'sold-out' ? 'Agotado' : 'Disponibilidad por confirmar';
  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={styles.toolbar}>
          <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Volver al catálogo" style={styles.iconButton}>
            <Ionicons name="chevron-back" size={24} color={palette.text} />
          </Pressable>
          <Pressable onPress={onShare} disabled={isSharing} accessibilityRole="button" accessibilityLabel="Compartir producto"
            accessibilityState={{ disabled: isSharing }} style={[styles.iconButton, isSharing && styles.disabled]}>
            <Ionicons name="share-social-outline" size={22} color={palette.text} />
          </Pressable>
        </View>
        <ProductGallery key={product.id} product={product} />
      </View>
      <View style={styles.body}>
        {!!error && <CatalogStatus kind="error" compact title="No se pudo actualizar el producto"
          message={error} actionLabel="Reintentar" onAction={onRetry} />}
        {shareError && <Text accessibilityRole="alert" style={styles.error}>{shareError}</Text>}
        <Text style={styles.brand}>{product.brand}</Text>
        <Text accessibilityRole="header" style={styles.name}>{product.name}</Text>
        <View style={styles.tags}>
          <View style={styles.category}><Text style={styles.categoryText}>{product.categoryLabel}</Text></View>
          {!!product.presentation && <View style={styles.presentation}><Text style={styles.presentationText}>{product.presentation}</Text></View>}
        </View>
        <Text style={styles.price}>{formatProductPrice(product.price)}</Text>
        <View style={styles.stockRow}>
          <Text style={[styles.availability, !available && styles.soldOut]}>● {availabilityText}</Text>
          {availability !== 'unknown' && <Text style={styles.secondaryText}>{product.stock} unidades en stock</Text>}
        </View>
        {isPreview && <Text style={styles.preview}>Producto de ejemplo: imagen ilustrativa, precio, información y existencias por confirmar.</Text>}
        <View style={styles.description}>
          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.secondaryText}>{product.description || 'Descripción pendiente de confirmar.'}</Text>
        </View>
        <View style={styles.features}>
          <Text style={styles.sectionTitle}>Características</Text>
          {product.features.length ? product.features.map((feature, index) => <View key={index} style={styles.featureRow}>
            <Ionicons name="checkmark" size={12} color={palette.secondaryBright} style={styles.check} />
            <Text style={styles.featureText}>{feature}</Text>
          </View>) : <Text style={styles.secondaryText}>Características pendientes de confirmar.</Text>}
        </View>
        <View style={styles.usage}>
          <Text style={styles.usageTitle}>Modo de uso</Text>
          <Text style={styles.secondaryText}>{product.usage || 'Modo de uso pendiente de confirmar.'}</Text>
        </View>
        <View style={styles.quantitySection}>
          <View style={styles.quantity}>
            <Pressable disabled={!canChangeQuantity} accessibilityRole="button" accessibilityLabel="Disminuir cantidad"
              accessibilityState={{ disabled: true }} style={styles.quantityButton}><Ionicons name="remove" size={20} color={palette.textMuted} /></Pressable>
            <Text accessibilityLabel={`Cantidad seleccionada: ${quantity}`} style={styles.quantityText}>{quantity}</Text>
            <Pressable disabled={!canChangeQuantity} accessibilityRole="button" accessibilityLabel="Aumentar cantidad"
              accessibilityState={{ disabled: true }} style={styles.quantityButton}><Ionicons name="add" size={20} color={palette.textMuted} /></Pressable>
          </View>
          <Text style={styles.restriction}>Inicia sesión para seleccionar cantidad</Text>
        </View>
      </View>
    </ScrollView>
    <View style={styles.footer}>
      <View style={styles.footerBody}>
        <View><Text style={styles.footerLabel}>PRECIO</Text><Text style={styles.footerPrice}>{formatProductPrice(product.price)}</Text></View>
        <Pressable accessibilityRole="button" onPress={onLogin} style={({ pressed }) => [styles.loginButton, pressed && styles.pressed]}>
          <LinearGradient colors={[palette.primaryBright, palette.secondaryBright]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.loginFill}>
            <Text style={styles.loginText}>{availability === 'sold-out' ? 'Iniciar sesión' : 'Iniciar sesión para comprar'}</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  </SafeAreaView>;
}
