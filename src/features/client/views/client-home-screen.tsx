import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  formatAppointmentTime,
  formatCalendarDate,
  formatClientPrice,
} from '@/features/client/components/client-appointment-helpers';
import { ClientHeader } from '@/features/client/components/client-header';
import { ClientLoadingState, ClientResourceMessage } from '@/features/client/components/client-resource-state';
import { ClientSectionHeading } from '@/features/client/components/client-controls';
import { useClientCartViewModel } from '@/features/client/view-models/use-client-cart-view-model';
import { useClientHomeViewModel } from '@/features/client/view-models/use-client-home-view-model';
import { clientScreenStyles as s } from '@/features/client/styles/client-screens.styles';
import { AppButton } from '@/shared/components/app-button';
import { AppCard } from '@/shared/components/app-card';
import { AppScreen } from '@/shared/components/app-screen';
import { AppText } from '@/shared/components/app-text';
import { palette } from '@/shared/theme/tokens';

const quickActions = [
  { icon: 'calendar-outline' as const, label: 'Agendar cita', route: '/client/appointments/schedule' as const },
  { icon: 'cut-outline' as const, label: 'Ver servicios', route: '/client/services' as const },
  { icon: 'bag-handle-outline' as const, label: 'Comprar productos', route: '/client/products' as const },
  { icon: 'notifications-outline' as const, label: 'Recordatorios', route: '/client/appointments/reminders' as const },
];

export function ClientHomeScreen() {
  const router = useRouter();
  const viewModel = useClientHomeViewModel();
  const { cart } = useClientCartViewModel();

  return (
    <AppScreen onRefresh={viewModel.refresh} refreshing={viewModel.isRefreshing}>
      <ClientHeader
        cartCount={cart.totalQuantity}
        compactTitle
        initials={viewModel.user?.firstName.slice(0, 2).toUpperCase()}
        notificationCount={viewModel.notificationCount}
        onCart={() => router.push('/client/products/cart')}
        onNotifications={() => router.push('/client/profile/notifications')}
        onProfile={() => router.push('/client/profile')}
        subtitle="Tu espacio de belleza"
        title="Estética Panamericana"
      />

      {viewModel.isLoading ? <ClientLoadingState label="Preparando tu inicio..." /> : null}
      {!viewModel.isLoading && viewModel.error ? (
        <ClientResourceMessage actionLabel="Reintentar" message={viewModel.error} onAction={viewModel.retry} title="No pudimos cargar tu inicio" tone="error" />
      ) : null}

      {!viewModel.isLoading && !viewModel.error ? (
        <>
          <View style={s.hero}>
            <AppText tone="muted">Hola, {viewModel.user?.firstName || 'cliente'}</AppText>
            <AppText variant="display">Tu próxima visita empieza aquí</AppText>
            <AppText tone="muted">Agenda, consulta tus pagos y encuentra productos desde un mismo lugar.</AppText>
            <AppButton label="Agendar una cita" onPress={() => router.push('/client/appointments/schedule')} />
          </View>

          {viewModel.nextAppointment ? (
            <View style={s.section}>
              <ClientSectionHeading title="Próxima cita" />
              <AppCard accentColor={palette.secondary} style={s.compactCard}>
                <View style={s.rowBetween}>
                  <AppText variant="subtitle">{viewModel.nextAppointment.serviceName || 'Servicio reservado'}</AppText>
                  <Ionicons color={palette.secondary} name="calendar" size={24} />
                </View>
                <AppText tone="muted">{formatCalendarDate(viewModel.nextAppointment.dateTime)} · {formatAppointmentTime(viewModel.nextAppointment.dateTime)}</AppText>
                <AppButton label="Ver mis citas" onPress={() => router.push('/client/appointments')} variant="secondary" />
              </AppCard>
            </View>
          ) : (
            <ClientResourceMessage actionLabel="Agendar ahora" icon="calendar-outline" message="Cuando reserves una cita aparecerá aquí." onAction={() => router.push('/client/appointments/schedule')} title="Aún no tienes próximas citas" />
          )}

          <View style={s.section}>
            <ClientSectionHeading title="Resumen" />
            <AppCard style={s.metrics}>
              <View style={s.metric}><AppText variant="title">{viewModel.upcomingCount}</AppText><AppText tone="muted" variant="caption">Próximas</AppText></View>
              <View style={styles.metricDivider} />
              <View style={s.metric}><AppText variant="title">{viewModel.completedCount}</AppText><AppText tone="muted" variant="caption">Completadas</AppText></View>
              <View style={styles.metricDivider} />
              <View style={s.metric}><AppText variant="subtitle">{formatClientPrice(viewModel.totalPaid)}</AppText><AppText tone="muted" variant="caption">Pagado</AppText></View>
            </AppCard>
          </View>

          <View style={s.section}>
            <ClientSectionHeading title="Accesos rápidos" />
            <View style={s.quickGrid}>
              {quickActions.map((action) => (
                <Pressable key={action.label} accessibilityRole="button" onPress={() => router.push(action.route)} style={({ pressed }) => [s.quickItem, pressed && styles.pressed]}>
                  <View style={s.iconCircle}><Ionicons color={palette.secondary} name={action.icon} size={24} /></View>
                  <AppText style={styles.centerText} variant="label">{action.label}</AppText>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={s.section}>
            <ClientSectionHeading action={<Pressable onPress={() => router.push('/public/more/promotions')}><AppText tone="primary" variant="label">Ver todas</AppText></Pressable>} title="Promociones" />
            {viewModel.highlights.promotions.length ? viewModel.highlights.promotions.slice(0, 2).map((promotion) => (
              <AppCard key={promotion.id} accentColor={palette.primaryBright} style={s.compactCard}>
                <View style={s.rowBetween}><AppText style={s.flex} variant="subtitle">{promotion.title}</AppText>{promotion.discount ? <AppText tone="primary" variant="label">{promotion.discount}</AppText> : null}</View>
                {promotion.description ? <AppText tone="muted">{promotion.description}</AppText> : null}
              </AppCard>
            )) : <AppText tone="muted">No hay promociones disponibles en este momento.</AppText>}
          </View>
        </>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  centerText: { textAlign: 'center' },
  metricDivider: { alignSelf: 'stretch', backgroundColor: palette.border, width: StyleSheet.hairlineWidth },
  pressed: { opacity: 0.7 },
});
