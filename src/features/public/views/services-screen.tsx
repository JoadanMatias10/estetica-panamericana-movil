import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FlatList, Keyboard, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { gradients, palette } from '@/shared/theme/tokens';
import { CatalogStatus } from '../components/catalog-status';
import { ServiceCard } from '../components/service-card';
import { ServiceDetail, ServicesFilters } from '../components/services-overlays';
import type { PublicService, ServiceCategory, ServiceFilters } from '../models/public-service';
import { styles } from '../styles/services-screen.styles';

type Props = {
  services: readonly PublicService[];
  categories: readonly ServiceCategory[];
  query: string;
  categoryId: string;
  isPreview: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  error?: string;
  hasActiveSearch: boolean;
  onRetry: () => void;
  onRefresh: () => void;
  activeFilterCount: number;
  filtersVisible: boolean;
  draftFilters: ServiceFilters;
  selectedService: PublicService | null;
  onQueryChange: (value: string) => void;
  onCategoryChange: (id: string) => void;
  onOpenFilters: () => void;
  onCloseFilters: () => void;
  onToggleFilter: (key: keyof ServiceFilters) => void;
  onClearDraftFilters: () => void;
  onApplyFilters: () => void;
  onResetSearch: () => void;
  onDetail: (service: PublicService) => void;
  onCloseDetail: () => void;
  onLogin: () => void;
};

export function ServicesScreen(props: Props) {
  const { width, fontScale } = useWindowDimensions();
  const categoryLabel = (id: string) => props.categories.find(category => category.id === id)?.label ?? id;
  const header = <>
    <Text accessibilityRole="header" style={styles.title}>Servicios</Text>
    <View style={styles.search}>
      <Ionicons name="search-outline" size={19} color={palette.textMuted} />
      <TextInput accessibilityLabel="Buscar servicios" placeholder="Buscar servicios..."
        placeholderTextColor={palette.textMuted} style={styles.input} value={props.query}
        onChangeText={props.onQueryChange} returnKeyType="search" onSubmitEditing={Keyboard.dismiss} />
      {!!props.query && <Pressable accessibilityRole="button" accessibilityLabel="Limpiar búsqueda"
        onPress={() => props.onQueryChange('')} style={styles.iconButton}>
        <Ionicons name="close-circle" size={19} color={palette.textMuted} />
      </Pressable>}
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}
      keyboardShouldPersistTaps="handled">
      {props.categories.map(category => {
        const selected = category.id === props.categoryId;
        return <Pressable key={category.id} accessibilityRole="button" accessibilityState={{ selected }}
          onPress={() => props.onCategoryChange(category.id)} style={[styles.chip, selected && styles.selectedChip]}>
          {selected ? <LinearGradient colors={[palette.primaryBright, palette.secondaryBright]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.chipGradient}>
            <Text style={[styles.chipText, styles.selectedChipText]}>{category.label}</Text>
          </LinearGradient> : <Text style={styles.chipText}>{category.label}</Text>}
        </Pressable>;
      })}
    </ScrollView>
    <View style={styles.filterRow}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Filtros, ${props.activeFilterCount} activos`}
        onPress={() => { Keyboard.dismiss(); props.onOpenFilters(); }} style={styles.filterButton}>
        <Ionicons name="options-outline" size={17} color={palette.text} />
        <Text style={styles.filterText}>Filtros</Text>
        {props.activeFilterCount > 0 && <LinearGradient colors={[palette.primaryBright, palette.secondaryBright]} style={styles.badge}>
          <Text style={styles.badgeText}>{props.activeFilterCount}</Text>
        </LinearGradient>}
      </Pressable>
    </View>
    <LinearGradient colors={gradients.soft} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.loginBanner}>
      <View style={styles.loginIcon}><Ionicons name="sparkles" size={16} color={palette.primaryBright} /></View>
      <Text style={styles.loginText}>Inicia sesión para agendar tus citas</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Ingresar para agendar una cita"
        onPress={props.onLogin} style={styles.linkButton}>
        <Text style={styles.linkText}>Ingresar</Text><Ionicons name="chevron-forward" size={13} color={palette.secondary} />
      </Pressable>
    </LinearGradient>
    {props.isPreview && <Text style={styles.preview}>Catálogo de ejemplo · precios y tiempos por confirmar.</Text>}
    {!!props.error && props.services.length > 0 && <CatalogStatus kind="error" compact
      title="No se pudo actualizar el catálogo" message={props.error} actionLabel="Reintentar" onAction={props.onRetry} />}
  </>;

  return <LinearGradient colors={gradients.screen} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.screen}>
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <FlatList data={props.services} keyExtractor={item => item.id} contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
        refreshing={props.isRefreshing} onRefresh={props.onRefresh}
        ListHeaderComponent={header} ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => <ServiceCard service={item} category={categoryLabel(item.categoryId)}
          compact={width < 360 || fontScale > 1.2} onDetail={props.onDetail} />}
        ListEmptyComponent={props.isLoading ? <CatalogStatus kind="loading" title="Cargando servicios…" />
          : props.error ? <CatalogStatus kind="error" title="No se pudieron cargar los servicios" message={props.error}
            actionLabel="Reintentar" onAction={props.onRetry} />
          : <CatalogStatus kind="empty"
            title={props.hasActiveSearch ? 'No se encontraron servicios' : 'Aún no hay servicios disponibles'}
            message={props.hasActiveSearch ? 'Prueba otra búsqueda o categoría, o limpia los filtros.' : 'Vuelve más tarde para consultar el catálogo.'}
            actionLabel={props.hasActiveSearch ? 'Restablecer búsqueda' : undefined}
            onAction={props.hasActiveSearch ? props.onResetSearch : undefined} />} />
      <ServicesFilters visible={props.filtersVisible} filters={props.draftFilters}
        onClose={props.onCloseFilters} onToggle={props.onToggleFilter} onClear={props.onClearDraftFilters} onApply={props.onApplyFilters} />
      <ServiceDetail service={props.selectedService} category={categoryLabel(props.selectedService?.categoryId ?? '')}
        isPreview={props.isPreview} onClose={props.onCloseDetail} onLogin={props.onLogin} />
    </SafeAreaView>
  </LinearGradient>;
}
