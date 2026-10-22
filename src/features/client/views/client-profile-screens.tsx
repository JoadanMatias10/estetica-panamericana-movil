import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Image, Pressable, View } from 'react-native';

import { formatCalendarDate } from '@/features/client/components/client-appointment-helpers';
import { ClientChip, ClientMenuRow, ClientPreferenceRow, ClientSectionHeading, ClientStatusBadge, ClientTextField } from '@/features/client/components/client-controls';
import { ClientPageHeader } from '@/features/client/components/client-page-header';
import { ClientLoadingState, ClientResourceMessage } from '@/features/client/components/client-resource-state';
import { clientStatusTone, formatClientCurrency, formatClientDateTime, getClientInitials } from '@/features/client/models/client-formatters';
import { clientScreenStyles as s } from '@/features/client/styles/client-screens.styles';
import { useClientNotificationPreferencesViewModel, useClientNotificationsViewModel } from '@/features/client/view-models/use-client-notifications-view-model';
import { type ClientPaymentFilter, useClientPaymentDetailViewModel, useClientPaymentsViewModel } from '@/features/client/view-models/use-client-payments-view-model';
import { useClientEditProfileViewModel, useClientProfileViewModel } from '@/features/client/view-models/use-client-profile-view-model';
import { useClientRemindersViewModel, useClientShareReminderViewModel } from '@/features/client/view-models/use-client-reminders-view-model';
import { clearClientSessionData } from '@/features/client/services/client-session-service';
import { AppButton } from '@/shared/components/app-button';
import { AppCard } from '@/shared/components/app-card';
import { AppScreen } from '@/shared/components/app-screen';
import { AppText } from '@/shared/components/app-text';
import { palette, radius, spacing } from '@/shared/theme/tokens';

export function ClientProfileScreen() {
  const router = useRouter();
  const vm = useClientProfileViewModel();
  const logout = () => Alert.alert('Cerrar sesión', '¿Deseas salir de tu cuenta?', [
    { style: 'cancel', text: 'Cancelar' },
    { style: 'destructive', text: 'Cerrar sesión', onPress: () => { void clearClientSessionData().then(() => router.replace('/public/login')); } },
  ]);
  const removePhoto = () => Alert.alert(
    'Eliminar foto',
    '¿Deseas volver a mostrar tus iniciales?',
    [
      { style: 'cancel', text: 'Cancelar' },
      {
        style: 'destructive',
        text: 'Eliminar',
        onPress: () => {
          void vm.removeProfilePhoto();
        },
      },
    ],
  );
  return (
    <AppScreen onRefresh={vm.refresh} refreshing={vm.isRefreshing}>
      <ClientPageHeader title="Mi perfil" />
      {vm.isLoading ? <ClientLoadingState label="Cargando tu perfil..." /> : null}
      {vm.error ? <ClientResourceMessage actionLabel="Reintentar" message={vm.error} onAction={vm.retry} title="No se pudo cargar el perfil" tone="error" /> : null}
      {vm.user ? (
        <>
          <View style={styles.profileHero}>
            <Pressable
              accessibilityLabel={vm.profilePhotoUri ? 'Cambiar foto de perfil' : 'Agregar foto de perfil'}
              accessibilityRole="button"
              disabled={vm.isSelectingPhoto}
              onPress={() => {
                void vm.selectProfilePhoto();
              }}
              style={({ pressed }) => [
                styles.avatar,
                pressed && styles.photoPressed,
                vm.isSelectingPhoto && styles.photoDisabled,
              ]}>
              {vm.profilePhotoUri ? (
                <Image
                  accessibilityIgnoresInvertColors
                  source={{ uri: vm.profilePhotoUri }}
                  style={styles.avatarImage}
                />
              ) : (
                <AppText style={styles.avatarText} variant="title">
                  {getClientInitials(vm.user.firstName, vm.user.paternalLastName)}
                </AppText>
              )}
              <View style={styles.cameraBadge}>
                <Ionicons color={palette.white} name="camera" size={16} />
              </View>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={vm.isSelectingPhoto}
              onPress={() => {
                void vm.selectProfilePhoto();
              }}>
              <AppText style={styles.photoActionText} variant="label">
                {vm.isSelectingPhoto
                  ? 'Abriendo galería...'
                  : vm.profilePhotoUri
                    ? 'Cambiar foto'
                    : 'Agregar foto'}
              </AppText>
            </Pressable>
            {vm.profilePhotoUri ? (
              <Pressable accessibilityRole="button" disabled={vm.isSelectingPhoto} onPress={removePhoto}>
                <AppText tone="error" variant="caption">Eliminar foto</AppText>
              </Pressable>
            ) : null}
            <AppText style={styles.localPhotoNote} tone="muted" variant="caption">
              La foto se guarda únicamente en este dispositivo.
            </AppText>
            {vm.photoError ? (
              <View style={s.errorBox}>
                <AppText tone="error">{vm.photoError}</AppText>
              </View>
            ) : null}
            <View style={s.centered}><AppText variant="title">{[vm.user.firstName, vm.user.paternalLastName, vm.user.maternalLastName].filter(Boolean).join(' ')}</AppText><AppText tone="muted">{vm.user.email}</AppText><AppText tone="muted">{vm.user.phone}</AppText></View>
          </View>
          {vm.googleLinkError ? <View style={s.errorBox}><AppText tone="error">{vm.googleLinkError}</AppText></View> : null}
          {vm.googleLinkMessage ? <View style={s.successBox}><AppText>{vm.googleLinkMessage}</AppText></View> : null}
          <AppCard>
            <ClientMenuRow description="Actualiza tus datos de contacto" icon="person-outline" onPress={() => router.push('/client/profile/edit')} title="Editar perfil" />
            {!vm.user.googleLinked ? (
              <ClientMenuRow
                description="Usa Google como alternativa para iniciar sesión"
                icon="logo-google"
                onPress={() => { void vm.linkGoogle(); }}
                title={vm.isLinkingGoogle ? 'Vinculando Google...' : 'Vincular Google'}
              />
            ) : null}
            <ClientMenuRow description="Consulta compras y servicios pagados" icon="wallet-outline" onPress={() => router.push('/client/profile/payments')} title="Historial de pagos" />
            <ClientMenuRow description="Anticipación y canal de tus citas" icon="alarm-outline" onPress={() => router.push('/client/appointments/reminders')} title="Recordatorios" />
            <ClientMenuRow description="Avisos de citas y promociones" icon="notifications-outline" onPress={() => router.push('/client/profile/preferences')} title="Preferencias de notificación" />
            <ClientMenuRow description="Mensajes registrados por el servidor" icon="mail-outline" onPress={() => router.push('/client/profile/notifications')} title="Notificaciones" />
          </AppCard>
          <AppCard>
            <ClientMenuRow description="Recibirás un correo para cambiarla" icon="key-outline" onPress={() => router.push('/public/recover-password')} title="Cambiar contraseña" />
            <ClientMenuRow icon="shield-checkmark-outline" onPress={() => router.push('/public/more/privacy')} title="Aviso de privacidad" />
            <ClientMenuRow icon="help-circle-outline" onPress={() => router.push('/public/more/contact')} title="Ayuda y contacto" />
            <ClientMenuRow destructive icon="log-out-outline" onPress={logout} title="Cerrar sesión" />
          </AppCard>
        </>
      ) : null}
    </AppScreen>
  );
}

export function ClientEditProfileScreen() {
  const router = useRouter();
  const vm = useClientEditProfileViewModel();
  const save = async () => {
    const result = await vm.save();
    if (result) Alert.alert('Perfil actualizado', result.message || 'Tus datos se guardaron correctamente.', [{ text: 'Aceptar', onPress: () => router.back() }]);
  };
  return (
    <AppScreen>
      <ClientPageHeader back title="Editar perfil" />
      {vm.isLoading ? <ClientLoadingState label="Cargando datos..." /> : null}
      {vm.error ? <ClientResourceMessage actionLabel="Reintentar" message={vm.error} onAction={vm.retry} title="No se pudo cargar el perfil" tone="error" /> : null}
      {!vm.isLoading && !vm.error ? (
        <View style={s.section}>
          <ClientTextField autoCapitalize="words" icon="person-outline" label="Nombre" onChangeText={vm.setFirstName} value={vm.firstName} />
          <ClientTextField autoCapitalize="words" label="Apellido paterno" onChangeText={vm.setPaternalLastName} value={vm.paternalLastName} />
          <ClientTextField autoCapitalize="words" label="Apellido materno" onChangeText={vm.setMaternalLastName} value={vm.maternalLastName} />
          <ClientTextField icon="call-outline" keyboardType="phone-pad" label="Teléfono" maxLength={10} onChangeText={vm.setPhone} value={vm.phone} />
          <ClientTextField autoCapitalize="none" editable={!vm.isGoogleEmail} icon="mail-outline" keyboardType="email-address" label="Correo electrónico" onChangeText={vm.setEmail} value={vm.email} />
          {vm.isGoogleEmail ? <AppText tone="muted" variant="caption">Este correo fue verificado por Google y no puede editarse aquí.</AppText> : null}
          {vm.saveError ? <View style={s.errorBox}><AppText tone="error">{vm.saveError}</AppText></View> : null}
          <AppButton disabled={vm.isSaving} label={vm.isSaving ? 'Guardando...' : 'Guardar cambios'} onPress={() => { void save(); }} />
        </View>
      ) : null}
    </AppScreen>
  );
}

const paymentFilters: { id: ClientPaymentFilter; label: string }[] = [
  { id: 'all', label: 'Todos' }, { id: 'pending', label: 'Pendientes' }, { id: 'paid', label: 'Pagados' }, { id: 'rejected', label: 'Rechazados' },
];

export function ClientPaymentHistoryScreen() {
  const router = useRouter();
  const vm = useClientPaymentsViewModel();
  return (
    <AppScreen onRefresh={vm.refresh} refreshing={vm.isRefreshing}>
      <ClientPageHeader back title="Historial de pagos" />
      <View style={s.chips}>{paymentFilters.map((filter) => <ClientChip key={filter.id} label={filter.label} onPress={() => vm.setFilter(filter.id)} selected={vm.filter === filter.id} />)}</View>
      {vm.isLoading ? <ClientLoadingState label="Cargando pagos..." /> : null}
      {vm.error ? <ClientResourceMessage actionLabel="Reintentar" message={vm.error} onAction={vm.retry} title="No se pudo cargar el historial" tone="error" /> : null}
      {!vm.isLoading && !vm.error && !vm.payments.length ? <ClientResourceMessage icon="receipt-outline" message="Los pagos que registres aparecerán aquí." title="Sin pagos en esta categoría" /> : null}
      <View style={s.list}>{vm.payments.map((payment) => (
        <Pressable key={payment.id} onPress={() => router.push({ pathname: '/client/profile/payments/[id]', params: { id: payment.id } })}>
          <AppCard style={s.compactCard}>
            <View style={s.rowBetween}><AppText style={s.flex} variant="subtitle">{payment.concept || payment.type}</AppText><ClientStatusBadge label={payment.status} tone={clientStatusTone(payment.status)} /></View>
            <AppText tone="muted">{formatClientDateTime(payment.date || payment.createdAt)}</AppText>
            <View style={s.rowBetween}><AppText tone="muted">{payment.method}</AppText><AppText tone="primary" variant="subtitle">{formatClientCurrency(payment.total)}</AppText></View>
          </AppCard>
        </Pressable>
      ))}</View>
    </AppScreen>
  );
}

export function ClientPaymentDetailScreen({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const vm = useClientPaymentDetailViewModel(paymentId);
  const statusIcon = vm.payment?.status === 'Rechazado' ? 'close-circle' : vm.payment?.status === 'Pagado' || vm.payment?.status === 'Confirmado' ? 'checkmark-circle' : 'time';
  const statusColor = vm.payment?.status === 'Rechazado' ? palette.error : vm.payment?.status === 'Pagado' || vm.payment?.status === 'Confirmado' ? palette.success : palette.warning;
  return (
    <AppScreen>
      <ClientPageHeader back title="Estado del pago" />
      {vm.isLoading ? <ClientLoadingState label="Consultando pago..." /> : null}
      {vm.error ? <ClientResourceMessage actionLabel="Reintentar" message={vm.error} onAction={vm.retry} title="No se pudo cargar el pago" tone="error" /> : null}
      {!vm.isLoading && !vm.error && !vm.payment ? <ClientResourceMessage message="El pago solicitado no existe en tu historial." title="Pago no encontrado" /> : null}
      {vm.payment ? (
        <>
          <View style={s.centered}><Ionicons color={statusColor} name={statusIcon} size={76} /><AppText variant="title">{vm.payment.status}</AppText><AppText tone="muted">{vm.payment.status === 'Rechazado' ? 'Revisa el motivo y vuelve a registrar el pago si corresponde.' : vm.payment.status === 'Pagado' || vm.payment.status === 'Confirmado' ? 'El pago fue confirmado.' : 'Tu pago está registrado y pendiente de revisión.'}</AppText></View>
          <AppCard style={s.compactCard}>
            <View style={s.summaryLine}><AppText tone="muted">Concepto</AppText><AppText style={s.flex}>{vm.payment.concept || vm.payment.type}</AppText></View>
            <View style={s.summaryLine}><AppText tone="muted">Método</AppText><AppText>{vm.payment.method}</AppText></View>
            <View style={s.summaryLine}><AppText tone="muted">Fecha</AppText><AppText>{formatClientDateTime(vm.payment.date || vm.payment.createdAt)}</AppText></View>
            <View style={s.divider} /><View style={s.summaryLine}><AppText variant="subtitle">Total</AppText><AppText style={s.price}>{formatClientCurrency(vm.payment.total)}</AppText></View>
            {vm.payment.reference ? <AppText tone="muted">Referencia: {vm.payment.reference}</AppText> : null}
            {vm.payment.reviewNotes ? <View style={vm.payment.status === 'Rechazado' ? s.errorBox : s.mutedBox}><AppText>{vm.payment.reviewNotes}</AppText></View> : null}
          </AppCard>
          {vm.payment.details.length ? <AppCard style={s.compactCard}><ClientSectionHeading title="Detalle" />{vm.payment.details.map((item) => <View key={`${item.itemId}-${item.name}`} style={s.summaryLine}><AppText style={s.flex}>{item.quantity} × {item.name}</AppText><AppText>{formatClientCurrency(item.subtotal)}</AppText></View>)}</AppCard> : null}
          <AppButton label="Volver al historial" onPress={() => router.replace('/client/profile/payments')} variant="secondary" />
        </>
      ) : null}
    </AppScreen>
  );
}

export function ClientNotificationPreferencesScreen() {
  const vm = useClientNotificationPreferencesViewModel();
  return (
    <AppScreen>
      <ClientPageHeader back title="Preferencias" />
      {vm.isLoading ? <ClientLoadingState label="Cargando preferencias..." /> : null}
      {vm.error && vm.isLoading ? <ClientResourceMessage actionLabel="Reintentar" message={vm.error} onAction={vm.retry} title="No se pudieron cargar" tone="error" /> : null}
      {!vm.isLoading ? (
        <>
          <ClientPreferenceRow description="Avisos cuando una cita cambie o sea cancelada" icon="calendar-outline" onValueChange={(value) => vm.setPreference('appointmentChanges', value)} title="Cambios en mis citas" value={vm.preferences.appointmentChanges} />
          <ClientPreferenceRow description="Recordatorios antes de tus próximas visitas" icon="alarm-outline" onValueChange={(value) => vm.setPreference('appointmentReminders', value)} title="Recordatorios de citas" value={vm.preferences.appointmentReminders} />
          <ClientPreferenceRow description="Novedades y promociones de la estética" icon="gift-outline" onValueChange={(value) => vm.setPreference('promotions', value)} title="Promociones" value={vm.preferences.promotions} />
          {vm.error ? <View style={s.errorBox}><AppText tone="error">{vm.error}</AppText></View> : null}
          {vm.message ? <View style={s.successBox}><AppText>{vm.message}</AppText></View> : null}
          <AppButton disabled={vm.isSaving} label={vm.isSaving ? 'Guardando...' : 'Guardar preferencias'} onPress={() => { void vm.save(); }} />
        </>
      ) : null}
    </AppScreen>
  );
}

export function ClientNotificationsScreen() {
  const vm = useClientNotificationsViewModel();
  return (
    <AppScreen onRefresh={vm.refresh} refreshing={vm.isRefreshing}>
      <ClientPageHeader back showNotifications={false} title="Notificaciones" />
      {vm.isLoading ? <ClientLoadingState label="Cargando notificaciones..." /> : null}
      {vm.error ? <ClientResourceMessage actionLabel="Reintentar" message={vm.error} onAction={vm.retry} title="No se pudieron cargar" tone="error" /> : null}
      {!vm.isLoading && !vm.error && !vm.notifications.length ? <ClientResourceMessage icon="notifications-off-outline" message="Aquí aparecerán los mensajes generados para tus citas." title="No tienes notificaciones" /> : null}
      <View style={s.list}>{vm.notifications.map((notification) => (
        <AppCard accentColor={clientStatusTone(notification.status) === 'error' ? palette.error : palette.secondary} key={notification.id} style={s.compactCard}>
          <View style={s.rowBetween}><AppText variant="label">{notification.type || 'Notificación'}</AppText><ClientStatusBadge label={notification.status.replace('_', ' ')} tone={clientStatusTone(notification.status)} /></View>
          <AppText>{notification.message}</AppText>
          <AppText tone="muted" variant="caption">{notification.channel} · {formatClientDateTime(notification.createdAt)}</AppText>
          {notification.errorMessage ? <AppText tone="error" variant="caption">{notification.errorMessage}</AppText> : null}
        </AppCard>
      ))}</View>
    </AppScreen>
  );
}

export function ClientRemindersScreen() {
  const router = useRouter();
  const vm = useClientRemindersViewModel();
  return (
    <AppScreen>
      <ClientPageHeader back title="Recordatorios" />
      {vm.isLoading ? <ClientLoadingState label="Cargando recordatorios..." /> : null}
      {vm.error && vm.isLoading ? <ClientResourceMessage actionLabel="Reintentar" message={vm.error} onAction={vm.retry} title="No se pudieron cargar" tone="error" /> : null}
      {!vm.isLoading ? (
        <>
          <View style={s.section}><ClientSectionHeading title="Anticipación" /><View style={s.chips}>{(['24 horas antes', '12 horas antes', '2 horas antes'] as const).map((advance) => <ClientChip key={advance} label={advance} onPress={() => vm.setAdvance(advance)} selected={vm.settings.advance === advance} />)}</View></View>
          <View style={s.section}><ClientSectionHeading title="Canal" /><View style={s.chips}>{(['Email', 'WhatsApp', 'Notificacion interna'] as const).map((channel) => <ClientChip key={channel} label={channel === 'Notificacion interna' ? 'Notificación interna' : channel} onPress={() => vm.setChannel(channel)} selected={vm.settings.channel === channel} />)}</View></View>
          {vm.error ? <View style={s.errorBox}><AppText tone="error">{vm.error}</AppText></View> : null}
          {vm.message ? <View style={s.successBox}><AppText>{vm.message}</AppText></View> : null}
          <AppButton disabled={vm.isSaving} label={vm.isSaving ? 'Guardando...' : 'Guardar recordatorio'} onPress={() => { void vm.save(); }} />
          <View style={s.section}><ClientSectionHeading title="Próximas citas" />{vm.appointments.length ? vm.appointments.slice(0, 3).map((appointment) => <AppCard key={appointment.id} style={s.compactCard}><AppText variant="label">{appointment.serviceName}</AppText><AppText tone="muted">{formatCalendarDate(appointment.dateTime)}</AppText><AppButton label="Compartir recordatorio" onPress={() => router.push({ pathname: '/client/appointments/share-reminder', params: { appointmentId: appointment.id } })} variant="secondary" /></AppCard>) : <AppText tone="muted">No tienes próximas citas para recordar.</AppText>}</View>
        </>
      ) : null}
    </AppScreen>
  );
}

export function ClientShareReminderScreen({ appointmentId }: { appointmentId?: string }) {
  const vm = useClientShareReminderViewModel(appointmentId);
  return (
    <AppScreen>
      <ClientPageHeader back title="Compartir recordatorio" />
      {vm.isLoading ? <ClientLoadingState label="Cargando tus citas..." /> : null}
      {vm.error ? <ClientResourceMessage actionLabel="Reintentar" message={vm.error} onAction={vm.retry} title="No se pudieron cargar" tone="error" /> : null}
      {!vm.isLoading && !vm.error && !vm.appointments.length ? <ClientResourceMessage message="Necesitas una cita próxima para preparar el mensaje." title="No hay citas disponibles" /> : null}
      {!vm.isLoading && !vm.error && vm.appointments.length ? (
        <>
          <View style={s.section}><ClientSectionHeading title="Selecciona una cita" />{vm.appointments.map((appointment) => <Pressable key={appointment.id} onPress={() => vm.setAppointmentId(appointment.id)}><AppCard accentColor={vm.appointmentId === appointment.id ? palette.secondary : undefined} style={s.compactCard}><AppText variant="label">{appointment.serviceName}</AppText><AppText tone="muted">{formatCalendarDate(appointment.dateTime)}</AppText></AppCard></Pressable>)}</View>
          <ClientTextField label="Mensaje" maxLength={500} multiline onChangeText={vm.setMessage} value={vm.message} />
          <View style={s.warningBox}><AppText>El servidor usará el canal configurado en Recordatorios. Si elegiste WhatsApp, abrirá la aplicación para que confirmes el envío.</AppText></View>
          {vm.submitError ? <View style={s.errorBox}><AppText tone="error">{vm.submitError}</AppText></View> : null}
          {vm.successMessage ? <View style={s.successBox}><AppText>{vm.successMessage}</AppText></View> : null}
          <AppButton disabled={!vm.selectedAppointment || !vm.message.trim() || vm.isSubmitting} label={vm.isSubmitting ? 'Preparando...' : 'Preparar recordatorio'} onPress={() => { void vm.prepare(); }} />
        </>
      ) : null}
    </AppScreen>
  );
}

const styles = {
  avatar: { alignItems: 'center' as const, backgroundColor: '#F3E8FF', borderColor: '#DDD6FE', borderRadius: radius.pill, borderWidth: 2, height: 92, justifyContent: 'center' as const, position: 'relative' as const, width: 92 },
  avatarImage: { borderRadius: radius.pill, height: '100%' as const, width: '100%' as const },
  avatarText: { color: palette.secondary },
  cameraBadge: { alignItems: 'center' as const, backgroundColor: palette.secondary, borderColor: palette.surface, borderRadius: radius.pill, borderWidth: 2, bottom: -2, height: 30, justifyContent: 'center' as const, position: 'absolute' as const, right: -2, width: 30 },
  localPhotoNote: { maxWidth: 250, textAlign: 'center' as const },
  photoActionText: { color: palette.primary },
  photoDisabled: { opacity: 0.55 },
  photoPressed: { opacity: 0.75 },
  profileHero: { alignItems: 'center' as const, gap: spacing.md },
};
