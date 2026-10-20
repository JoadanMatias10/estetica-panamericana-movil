import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Alert, FlatList, Pressable, ScrollView, Share, View, useWindowDimensions } from 'react-native';

import { ClientChip, ClientSectionHeading, ClientTextField } from '@/features/client/components/client-controls';
import { ClientPageHeader } from '@/features/client/components/client-page-header';
import { ClientLoadingState, ClientResourceMessage } from '@/features/client/components/client-resource-state';
import { clientCatalogStyles as catalogStyles } from '@/features/client/styles/client-catalog.styles';
import { clientScreenStyles as s } from '@/features/client/styles/client-screens.styles';
import { useClientCartViewModel } from '@/features/client/view-models/use-client-cart-view-model';
import { useClientProductCheckoutViewModel } from '@/features/client/view-models/use-client-product-checkout-view-model';
import { useClientProductDetailViewModel } from '@/features/client/view-models/use-client-product-detail-view-model';
import { useClientProductsViewModel } from '@/features/client/view-models/use-client-products-view-model';
import { ProductCard } from '@/features/public/components/product-card';
import { ProductGallery } from '@/features/public/components/product-gallery';
import { formatProductPrice } from '@/features/public/models/public-product';
import { AppButton } from '@/shared/components/app-button';
import { AppCard } from '@/shared/components/app-card';
import { AppScreen } from '@/shared/components/app-screen';
import { AppText } from '@/shared/components/app-text';
import { layout, palette } from '@/shared/theme/tokens';

export function ClientProductsScreen() {
  const router = useRouter();
  const vm = useClientProductsViewModel();
  const { fontScale, width } = useWindowDimensions();
  const columns = width < 340 || fontScale > 1.3 ? 1 : 2;
  const cardWidth = (Math.min(width, layout.contentMaxWidth) - 44) / 2;
  const header = (
    <View style={catalogStyles.listHeader}>
      <ClientPageHeader subtitle="Productos disponibles desde el servidor" title="Productos" />
      <ClientTextField icon="search-outline" label="Buscar" onChangeText={vm.setQuery} placeholder="Nombre, marca o categoría" value={vm.query} />
      <ScrollView
        horizontal
        contentContainerStyle={[s.scrollRow, catalogStyles.categoryRow]}
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false}
        style={s.horizontalScroller}>
        {vm.categories.map((category) => <ClientChip key={category.id} label={category.label} onPress={() => vm.setCategoryId(category.id)} selected={vm.categoryId === category.id} />)}
      </ScrollView>
      {vm.error && vm.products.length ? <ClientResourceMessage actionLabel="Reintentar" message={vm.error} onAction={vm.retry} title="No se pudo actualizar el catálogo" tone="error" /> : null}
    </View>
  );

  return (
    <AppScreen scroll={false}>
      <FlatList
        columnWrapperStyle={columns === 2 ? catalogStyles.productRow : undefined}
        contentContainerStyle={catalogStyles.listContent}
        data={vm.products}
        ItemSeparatorComponent={() => <View style={catalogStyles.rowSeparator} />}
        key={`client-products-${columns}`}
        keyExtractor={(product) => product.id}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={vm.isLoading
          ? <ClientLoadingState label="Cargando productos..." />
          : vm.error
            ? <ClientResourceMessage actionLabel="Reintentar" message={vm.error} onAction={vm.retry} title="No se pudo cargar el catálogo" tone="error" />
            : <ClientResourceMessage actionLabel="Limpiar búsqueda" icon="search-outline" message="Prueba con otro nombre o categoría." onAction={vm.reset} title="No encontramos productos" />}
        ListHeaderComponent={header}
        numColumns={columns}
        onRefresh={vm.refresh}
        refreshing={vm.isRefreshing}
        renderItem={({ item }) => (
          <ProductCard
            maxWidth={columns === 2 ? cardWidth : undefined}
            onDetail={(id) => router.push({ pathname: '/client/products/[id]', params: { id } })}
            product={item}
          />
        )}
        showsVerticalScrollIndicator={false}
        style={catalogStyles.list}
      />
    </AppScreen>
  );
}

export function ClientProductDetailScreen({ productId }: { productId: string }) {
  const router = useRouter();
  const vm = useClientProductDetailViewModel(productId);
  const add = async (goToCart = false) => {
    const added = await vm.addToCart();
    if (added && goToCart) router.push('/client/products/cart');
    else if (added) Alert.alert('Producto agregado', 'El producto se agregó a tu carrito.');
  };
  const share = async () => {
    if (vm.product) await Share.share({ message: `${vm.product.name} · ${formatProductPrice(vm.product.price)}\nDisponible en Estética Panamericana.` });
  };
  return (
    <AppScreen>
      <ClientPageHeader back title="Detalle del producto" />
      {vm.isLoading ? <ClientLoadingState label="Cargando producto..." /> : null}
      {vm.error ? <ClientResourceMessage actionLabel="Reintentar" message={vm.error} onAction={vm.retry} title="No se pudo cargar el producto" tone="error" /> : null}
      {!vm.isLoading && !vm.error && !vm.product ? <ClientResourceMessage message="El producto ya no está disponible." title="Producto no encontrado" /> : null}
      {vm.product ? (
        <>
          <ProductGallery product={vm.product} />
          <View style={s.section}>
            <AppText tone="primary" variant="label">{vm.product.brand}</AppText>
            <AppText variant="display">{vm.product.name}</AppText>
            {vm.product.presentation ? <AppText tone="muted">{vm.product.presentation}</AppText> : null}
            <AppText style={s.price}>{formatProductPrice(vm.product.price)}</AppText>
            <AppText tone="muted">{vm.product.description || 'Producto disponible en Estética Panamericana.'}</AppText>
            {vm.product.features.length ? <AppCard style={s.compactCard}><AppText variant="subtitle">Características</AppText>{vm.product.features.map((feature) => <AppText key={feature}>• {feature}</AppText>)}</AppCard> : null}
            {vm.product.usage ? <AppCard style={s.compactCard}><AppText variant="subtitle">Modo de uso</AppText><AppText tone="muted">{vm.product.usage}</AppText></AppCard> : null}
          </View>
          <View style={s.rowBetween}>
            <AppText variant="label">Cantidad</AppText>
            <View style={s.quantity}>
              <Pressable accessibilityLabel="Disminuir cantidad" disabled={vm.quantity <= 1} onPress={vm.decrement} style={s.quantityButton}><Ionicons color={palette.secondary} name="remove" size={20} /></Pressable>
              <AppText variant="subtitle">{vm.quantity}</AppText>
              <Pressable accessibilityLabel="Aumentar cantidad" disabled={vm.quantity >= vm.stock} onPress={vm.increment} style={s.quantityButton}><Ionicons color={palette.secondary} name="add" size={20} /></Pressable>
            </View>
          </View>
          <AppText tone={vm.stock > 0 ? 'muted' : 'error'}>{vm.stock > 0 ? `${vm.stock} disponibles` : 'Producto agotado'}</AppText>
          {vm.actionError ? <View style={s.errorBox}><AppText tone="error">{vm.actionError}</AppText></View> : null}
          <View style={s.actions}>
            <AppButton disabled={!vm.canAdd || vm.isAdding} label={vm.isAdding ? 'Agregando...' : 'Agregar al carrito'} onPress={() => { void add(); }} />
            <AppButton disabled={!vm.canAdd || vm.isAdding} label="Comprar ahora" onPress={() => { void add(true); }} variant="secondary" />
            <AppButton label="Compartir" onPress={() => { void share(); }} variant="ghost" />
          </View>
        </>
      ) : null}
    </AppScreen>
  );
}

export function ClientCartScreen() {
  const router = useRouter();
  const vm = useClientCartViewModel();
  const confirmClear = () => Alert.alert('Vaciar carrito', '¿Deseas quitar todos los productos?', [
    { style: 'cancel', text: 'Cancelar' },
    { style: 'destructive', text: 'Vaciar', onPress: () => { void vm.clearCart(); } },
  ]);
  return (
    <AppScreen>
      <ClientPageHeader back showCart={false} title="Mi carrito" />
      {!vm.cart.isHydrated ? <ClientLoadingState label="Cargando carrito..." /> : null}
      {vm.cart.isHydrated && !vm.cart.items.length ? <ClientResourceMessage actionLabel="Explorar productos" icon="bag-handle-outline" message="Agrega productos del catálogo para continuar." onAction={() => router.replace('/client/products')} title="Tu carrito está vacío" /> : null}
      <View style={s.list}>
        {vm.cart.items.map((item) => (
          <AppCard key={item.productId} style={s.horizontalCard}>
            {item.imageUrl ? <Image accessibilityLabel={item.name} contentFit="contain" source={{ uri: item.imageUrl }} style={s.imageSmall} /> : <View style={[s.imageSmall, s.centered]}><Ionicons color={palette.secondary} name="bag-outline" size={28} /></View>}
            <View style={[s.flex, s.compactCard]}>
              <AppText numberOfLines={2} variant="label">{item.name}</AppText>
              {item.presentation ? <AppText tone="muted" variant="caption">{item.presentation}</AppText> : null}
              <AppText tone="primary" variant="label">{formatProductPrice(item.unitPrice * item.quantity)}</AppText>
              <View style={s.rowBetween}>
                <View style={s.quantity}>
                  <Pressable onPress={() => { void vm.updateQuantity(item.productId, item.quantity - 1); }} style={s.quantityButton}><Ionicons color={palette.secondary} name="remove" size={18} /></Pressable>
                  <AppText>{item.quantity}</AppText>
                  <Pressable disabled={item.quantity >= item.stock} onPress={() => { void vm.updateQuantity(item.productId, item.quantity + 1); }} style={s.quantityButton}><Ionicons color={palette.secondary} name="add" size={18} /></Pressable>
                </View>
                <Pressable accessibilityLabel={`Quitar ${item.name}`} onPress={() => { void vm.removeItem(item.productId); }}><Ionicons color={palette.error} name="trash-outline" size={21} /></Pressable>
              </View>
            </View>
          </AppCard>
        ))}
      </View>
      {vm.cart.items.length ? (
        <>
          <AppCard style={s.compactCard}>
            <ClientSectionHeading title="Resumen" />
            <View style={s.summaryLine}><AppText tone="muted">Productos ({vm.cart.totalQuantity})</AppText><AppText>{formatProductPrice(vm.cart.subtotal)}</AppText></View>
            <View style={s.divider} />
            <View style={s.summaryLine}><AppText variant="subtitle">Total</AppText><AppText style={s.price}>{formatProductPrice(vm.cart.subtotal)}</AppText></View>
          </AppCard>
          <AppButton label="Continuar al pago" onPress={() => router.push('/client/products/checkout')} />
          <AppButton label="Vaciar carrito" onPress={confirmClear} variant="ghost" />
        </>
      ) : null}
    </AppScreen>
  );
}

export function ClientProductCheckoutScreen() {
  const router = useRouter();
  const vm = useClientProductCheckoutViewModel();
  const submit = async () => {
    const result = await vm.submit();
    if (result) router.replace({ pathname: '/client/profile/payments/[id]', params: { id: result.payment.id } });
  };
  return (
    <AppScreen>
      <ClientPageHeader back showCart={false} title="Confirmar compra" />
      {vm.isLoading ? <ClientLoadingState label="Preparando el pago..." /> : null}
      {vm.error ? <ClientResourceMessage actionLabel="Reintentar" message={vm.error} onAction={vm.retry} title="No se pudo preparar la compra" tone="error" /> : null}
      {!vm.isLoading && !vm.error && !vm.cart.items.length ? <ClientResourceMessage actionLabel="Volver a productos" message="Tu carrito está vacío." onAction={() => router.replace('/client/products')} title="No hay productos para comprar" /> : null}
      {!vm.isLoading && !vm.error && vm.cart.items.length ? (
        <>
          <AppCard style={s.compactCard}>
            <ClientSectionHeading title="Tu pedido" />
            {vm.cart.items.map((item) => <View key={item.productId} style={s.summaryLine}><AppText style={s.flex}>{item.quantity} × {item.name}</AppText><AppText>{formatProductPrice(item.unitPrice * item.quantity)}</AppText></View>)}
            <View style={s.divider} /><View style={s.summaryLine}><AppText variant="subtitle">Total</AppText><AppText style={s.price}>{formatProductPrice(vm.cart.subtotal)}</AppText></View>
          </AppCard>
          <View style={s.section}>
            <ClientSectionHeading title="Método de pago" />
            <View style={s.chips}><ClientChip label="Pago en sucursal" onPress={() => vm.selectMethod('Pago en sucursal')} selected={vm.method === 'Pago en sucursal'} /><ClientChip label="Transferencia" onPress={() => vm.selectMethod('Transferencia')} selected={vm.method === 'Transferencia'} /></View>
          </View>
          {vm.method === 'Transferencia' ? (
            <AppCard style={s.compactCard}>
              <AppText variant="subtitle">Transferencia bancaria</AppText>
              {vm.config?.bankTransfer.isDemo ? <View style={s.warningBox}><AppText>Los datos bancarios están marcados como demostración; este método no puede utilizarse todavía.</AppText></View> : null}
              <AppText tone="muted">Banco: {vm.config?.bankTransfer.bank || 'No configurado'}</AppText>
              <AppText tone="muted">Beneficiario: {vm.config?.bankTransfer.beneficiary || 'No configurado'}</AppText>
              <AppText tone="muted">CLABE: {vm.config?.bankTransfer.clabe || 'No configurada'}</AppText>
              <ClientTextField label="Referencia" onChangeText={vm.setReference} placeholder="Folio de transferencia" value={vm.reference} />
              <AppButton disabled={vm.isPicking} label={vm.proof ? 'Cambiar comprobante' : 'Adjuntar comprobante'} onPress={() => { void vm.pickProof(); }} variant="secondary" />
              {vm.proof ? <View style={s.successBox}><AppText>{vm.proof.name}</AppText><Pressable onPress={vm.removeProof}><AppText tone="primary">Quitar</AppText></Pressable></View> : null}
            </AppCard>
          ) : <View style={s.warningBox}><AppText>Tu solicitud quedará pendiente para pagar y recoger en la sucursal.</AppText></View>}
          <ClientTextField label="Notas del pedido (opcional)" multiline onChangeText={vm.setNotes} value={vm.notes} />
          {vm.submitError ? <View style={s.errorBox}><AppText tone="error">{vm.submitError}</AppText></View> : null}
          <AppButton disabled={!vm.canSubmit || vm.isSubmitting} label={vm.isSubmitting ? 'Registrando...' : 'Confirmar pedido'} onPress={() => { void submit(); }} />
        </>
      ) : null}
    </AppScreen>
  );
}
