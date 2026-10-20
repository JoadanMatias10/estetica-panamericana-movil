import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Alert, FlatList, Pressable, ScrollView, Share, View } from 'react-native';

import { formatCalendarDate, formatClientPrice } from '@/features/client/components/client-appointment-helpers';
import { ClientChip, ClientSectionHeading, ClientTextField } from '@/features/client/components/client-controls';
import { ClientPageHeader } from '@/features/client/components/client-page-header';
import { ClientLoadingState, ClientResourceMessage } from '@/features/client/components/client-resource-state';
import { ClientServiceCard } from '@/features/client/components/client-service-card';
import { clientCatalogStyles as catalogStyles } from '@/features/client/styles/client-catalog.styles';
import { clientScreenStyles as s } from '@/features/client/styles/client-screens.styles';
import { useClientServiceDetailViewModel } from '@/features/client/view-models/use-client-service-detail-view-model';
import { useClientServicePaymentViewModel } from '@/features/client/view-models/use-client-service-payment-view-model';
import { useClientServicesViewModel } from '@/features/client/view-models/use-client-services-view-model';
import { formatServicePrice } from '@/features/public/models/public-service';
import { AppButton } from '@/shared/components/app-button';
import { AppCard } from '@/shared/components/app-card';
import { AppScreen } from '@/shared/components/app-screen';
import { AppText } from '@/shared/components/app-text';
import { palette } from '@/shared/theme/tokens';

export function ClientServicesScreen() {
  const router = useRouter();
  const vm = useClientServicesViewModel();
  const categoryLabel = (id: string) => vm.categories.find((item) => item.id === id)?.label || 'Servicio';
  const header = (
    <View style={catalogStyles.listHeader}>
      <ClientPageHeader subtitle="Servicios disponibles en tiempo real" title="Servicios" />
      <ClientTextField icon="search-outline" label="Buscar" onChangeText={vm.setQuery} placeholder="Corte, color, uñas..." returnKeyType="search" value={vm.query} />
      <ScrollView
        horizontal
        contentContainerStyle={[s.scrollRow, catalogStyles.categoryRow]}
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false}
        style={s.horizontalScroller}>
        {vm.categories.map((category) => <ClientChip key={category.id} label={category.label} onPress={() => vm.setCategoryId(category.id)} selected={vm.categoryId === category.id} />)}
      </ScrollView>
      {vm.error && vm.services.length ? <ClientResourceMessage actionLabel="Reintentar" message={vm.error} onAction={vm.retry} title="No se pudo actualizar el catálogo" tone="error" /> : null}
    </View>
  );

  return (
    <AppScreen scroll={false}>
      <FlatList
        contentContainerStyle={catalogStyles.listContent}
        data={vm.services}
        ItemSeparatorComponent={() => <View style={catalogStyles.rowSeparator} />}
        keyExtractor={(service) => service.id}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={vm.isLoading
          ? <ClientLoadingState label="Cargando servicios..." />
          : vm.error
            ? <ClientResourceMessage actionLabel="Reintentar" message={vm.error} onAction={vm.retry} title="No se pudo cargar el catálogo" tone="error" />
            : <ClientResourceMessage actionLabel="Limpiar búsqueda" icon="search-outline" message="Prueba con otro nombre o categoría." onAction={vm.reset} title="No encontramos servicios" />}
        ListHeaderComponent={header}
        onRefresh={vm.refresh}
        refreshing={vm.isRefreshing}
        renderItem={({ item }) => (
          <ClientServiceCard
            category={categoryLabel(item.categoryId)}
            onDetail={(service) => router.push({ pathname: '/client/services/[id]', params: { id: service.id } })}
            onSchedule={(service) => router.push({ pathname: '/client/appointments/schedule', params: { serviceId: service.id } })}
            service={item}
          />
        )}
        showsVerticalScrollIndicator={false}
        style={catalogStyles.list}
      />
    </AppScreen>
  );
}

export function ClientServiceDetailScreen({ serviceId }: { serviceId: string }) {
  const router = useRouter();
  const vm = useClientServiceDetailViewModel(serviceId);
  const share = async () => {
    if (!vm.service) return;
    await Share.share({ message: `${vm.service.name}\n${vm.service.description || 'Disponible en Estética Panamericana.'}` });
  };
  return (
    <AppScreen>
      <ClientPageHeader back title="Detalle del servicio" />
      {vm.isLoading ? <ClientLoadingState label="Cargando servicio..." /> : null}
      {vm.error ? <ClientResourceMessage actionLabel="Reintentar" message={vm.error} onAction={vm.retry} title="No se pudo cargar el servicio" tone="error" /> : null}
      {!vm.isLoading && !vm.error && !vm.service ? <ClientResourceMessage message="Este servicio ya no está disponible." title="Servicio no encontrado" /> : null}
      {vm.service ? (
        <>
          {vm.service.image ? <Image accessibilityLabel={`Imagen de ${vm.service.name}`} contentFit="cover" source={vm.service.image} style={s.image} /> : <View style={[s.image, s.centered]}><Ionicons color={palette.secondaryBright} name="sparkles-outline" size={52} /></View>}
          <View style={s.section}>
            <AppText variant="display">{vm.service.name}</AppText>
            <View style={s.metadata}>
              {vm.service.priceFrom !== undefined ? <AppText style={s.price}>Desde {formatServicePrice(vm.service.priceFrom)}</AppText> : null}
              {vm.service.durationText ? <AppText tone="muted">{vm.service.durationText}</AppText> : null}
            </View>
            <AppText tone="muted">{vm.service.description || 'Consulta disponibilidad y agenda el horario que prefieras.'}</AppText>
            {vm.service.segment || vm.service.subcategory ? <AppText variant="label">{[vm.service.segment, vm.service.subcategory].filter(Boolean).join(' · ')}</AppText> : null}
          </View>
          <View style={s.actions}>
            <AppButton label="Agendar este servicio" onPress={() => router.push({ pathname: '/client/appointments/schedule', params: { serviceId } })} />
            <AppButton label="Consultar disponibilidad" onPress={() => router.push({ pathname: '/client/appointments/availability', params: { serviceId } })} variant="secondary" />
            <AppButton label="Compartir" onPress={() => { void share(); }} variant="ghost" />
          </View>
        </>
      ) : null}
    </AppScreen>
  );
}

type ServicePaymentProps = { appointmentId?: string; serviceId?: string };

export function ClientServicePaymentScreen(initial: ServicePaymentProps) {
  const router = useRouter();
  const vm = useClientServicePaymentViewModel(initial);
  const submit = async () => {
    const result = await vm.submit();
    if (!result) return;
    Alert.alert('Pago registrado', result.message || 'Puedes consultar el estado en tu historial.', [
      { text: 'Ver estado', onPress: () => router.replace({ pathname: '/client/profile/payments/[id]', params: { id: result.payment.id } }) },
    ]);
  };
  return (
    <AppScreen>
      <ClientPageHeader back title="Pago de servicio" />
      {vm.isLoading ? <ClientLoadingState label="Preparando el pago..." /> : null}
      {vm.error ? <ClientResourceMessage actionLabel="Reintentar" message={vm.error} onAction={vm.retry} title="No se pudo preparar el pago" tone="error" /> : null}
      {!vm.isLoading && !vm.error && !vm.appointments.length ? <ClientResourceMessage actionLabel="Ver mis citas" icon="wallet-outline" message="Solo pueden pagarse citas activas que tengan un servicio asociado." onAction={() => router.replace('/client/appointments')} title="No hay citas pendientes de pago" /> : null}
      {!vm.isLoading && !vm.error && vm.appointments.length ? (
        <>
          <View style={s.section}>
            <ClientSectionHeading title="Cita" />
            {vm.appointments.map((appointment) => (
              <Pressable key={appointment.id} onPress={() => vm.setSelectedAppointmentId(appointment.id)}>
                <AppCard accentColor={vm.selectedAppointmentId === appointment.id ? palette.secondary : undefined} style={s.compactCard}>
                  <AppText variant="label">{appointment.serviceName}</AppText>
                  <AppText tone="muted" variant="caption">{formatCalendarDate(appointment.dateTime)} · {formatClientPrice(appointment.servicePrice)}</AppText>
                </AppCard>
              </Pressable>
            ))}
          </View>
          <View style={s.section}>
            <ClientSectionHeading title="Método de pago" />
            <View style={s.chips}>
              <ClientChip label="Pago en sucursal" onPress={() => vm.selectMethod('Pago en sucursal')} selected={vm.method === 'Pago en sucursal'} />
              <ClientChip label="Transferencia" onPress={() => vm.selectMethod('Transferencia')} selected={vm.method === 'Transferencia'} />
            </View>
          </View>
          {vm.method === 'Transferencia' ? (
            <AppCard style={s.compactCard}>
              <AppText variant="subtitle">Datos bancarios</AppText>
              {vm.config?.bankTransfer.isDemo ? <View style={s.warningBox}><AppText>La cuenta está marcada como demostración; el servidor no permite registrar transferencias todavía.</AppText></View> : null}
              <AppText tone="muted">Banco: {vm.config?.bankTransfer.bank || 'No configurado'}</AppText>
              <AppText tone="muted">Beneficiario: {vm.config?.bankTransfer.beneficiary || 'No configurado'}</AppText>
              <AppText tone="muted">CLABE: {vm.config?.bankTransfer.clabe || 'No configurada'}</AppText>
              <ClientTextField label="Referencia" maxLength={80} onChangeText={vm.setReference} placeholder="Últimos dígitos o folio" value={vm.reference} />
              <AppButton disabled={vm.isPickingProof} label={vm.proof ? 'Cambiar comprobante' : 'Seleccionar comprobante'} onPress={() => { void vm.pickProof(); }} variant="secondary" />
              {vm.proof ? <View style={s.successBox}><AppText variant="label">Archivo: {vm.proof.name}</AppText><Pressable onPress={vm.removeProof}><AppText tone="primary">Quitar</AppText></Pressable></View> : null}
            </AppCard>
          ) : <View style={s.warningBox}><AppText>El pago se registrará como pendiente y se liquidará directamente en la sucursal.</AppText></View>}
          <ClientTextField label="Notas (opcional)" maxLength={500} multiline onChangeText={vm.setNotes} value={vm.notes} />
          {vm.submitError ? <View style={s.errorBox}><AppText tone="error">{vm.submitError}</AppText></View> : null}
          <AppButton disabled={!vm.canSubmit || vm.isSubmitting} label={vm.isSubmitting ? 'Registrando...' : `Registrar ${formatClientPrice(vm.selectedAppointment?.servicePrice || 0)}`} onPress={() => { void submit(); }} />
        </>
      ) : null}
    </AppScreen>
  );
}
