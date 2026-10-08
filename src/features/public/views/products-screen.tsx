import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FlatList, Keyboard, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { gradients, layout, palette } from '@/shared/theme/tokens';
import { CatalogStatus } from '../components/catalog-status';
import { ProductCard } from '../components/product-card';
import type { ProductCategory, PublicProduct } from '../models/public-product';
import { styles } from '../styles/products-screen.styles';

type Props = {
  products: readonly PublicProduct[];
  categories: readonly ProductCategory[];
  query: string;
  categoryId: string;
  isPreview: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  error?: string;
  hasActiveSearch: boolean;
  onRetry: () => void;
  onRefresh: () => void;
  onQueryChange: (query: string) => void;
  onCategoryChange: (id: string) => void;
  onResetSearch: () => void;
  onDetail: (id: string) => void;
  onLogin: () => void;
};

export function ProductsScreen(props: Props) {
  const { width, fontScale } = useWindowDimensions();
  const columns = width < 330 || fontScale > 1.3 ? 1 : 2;
  const cardWidth = (Math.min(width, layout.contentMaxWidth) - 44) / 2;
  const header = <>
    <Text accessibilityRole="header" style={styles.title}>Productos</Text>
    <View style={styles.search}>
      <Ionicons name="search-outline" size={19} color={palette.textMuted} />
      <TextInput accessibilityLabel="Buscar productos" placeholder="Buscar productos..." placeholderTextColor={palette.textMuted}
        style={styles.input} value={props.query} onChangeText={props.onQueryChange} returnKeyType="search" onSubmitEditing={Keyboard.dismiss} />
      {!!props.query && <Pressable accessibilityRole="button" accessibilityLabel="Limpiar búsqueda" style={styles.iconButton}
        onPress={() => props.onQueryChange('')}><Ionicons name="close-circle" size={19} color={palette.textMuted} /></Pressable>}
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.categories}>
      {props.categories.map(category => {
        const selected = category.id === props.categoryId;
        return <Pressable key={category.id} accessibilityRole="button" accessibilityState={{ selected }}
          onPress={() => props.onCategoryChange(category.id)} style={[styles.chip, selected && styles.activeChip]}>
          {selected ? <LinearGradient colors={[palette.primaryBright, palette.secondaryBright]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.chipFill}>
            <Text style={[styles.chipText, styles.activeChipText]}>{category.label}</Text>
          </LinearGradient> : <Text style={styles.chipText}>{category.label}</Text>}
        </Pressable>;
      })}
    </ScrollView>
    <LinearGradient colors={gradients.soft} style={styles.banner}>
      <View style={styles.bannerIcon}><Ionicons name="sparkles" size={16} color={palette.primaryBright} /></View>
      <Text style={styles.bannerText}>Inicia sesión para comprar</Text>
      <Pressable accessibilityRole="button" onPress={props.onLogin} style={styles.link}>
        <Text style={styles.linkText}>Ingresar</Text><Ionicons name="chevron-forward" size={13} color={palette.secondary} />
      </Pressable>
    </LinearGradient>
    {props.isPreview && <Text style={styles.preview}>Catálogo de ejemplo · imágenes ilustrativas; precios y existencias por confirmar.</Text>}
    {!!props.error && props.products.length > 0 && <CatalogStatus kind="error" compact
      title="No se pudo actualizar el catálogo" message={props.error} actionLabel="Reintentar" onAction={props.onRetry} />}
  </>;
  return <LinearGradient colors={gradients.screen} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.screen}>
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <FlatList key={`products-${columns}`} data={props.products} numColumns={columns} keyExtractor={item => item.id}
        contentContainerStyle={styles.content} columnWrapperStyle={columns === 2 ? styles.row : undefined}
        ListHeaderComponent={header} ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}
        refreshing={props.isRefreshing} onRefresh={props.onRefresh}
        renderItem={({ item }) => <ProductCard product={item} maxWidth={columns === 2 ? cardWidth : undefined} onDetail={props.onDetail} />}
        ListEmptyComponent={props.isLoading ? <CatalogStatus kind="loading" title="Cargando productos…" />
          : props.error ? <CatalogStatus kind="error" title="No se pudieron cargar los productos" message={props.error}
            actionLabel="Reintentar" onAction={props.onRetry} />
          : <CatalogStatus kind="empty" icon="bag-outline"
            title={props.hasActiveSearch ? 'No se encontraron productos' : 'Aún no hay productos disponibles'}
            message={props.hasActiveSearch ? 'Prueba otra palabra o categoría.' : 'Vuelve más tarde para consultar el catálogo.'}
            actionLabel={props.hasActiveSearch ? 'Restablecer búsqueda' : undefined}
            onAction={props.hasActiveSearch ? props.onResetSearch : undefined} />} />
    </SafeAreaView>
  </LinearGradient>;
}
