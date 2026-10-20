import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppScreen } from '@/shared/components/app-screen';
import { AppText } from '@/shared/components/app-text';
import { palette } from '@/shared/theme/tokens';
import { StylistButton, StylistCard, StylistEmpty, StylistHeader, StylistModal, StylistNotice, StylistStatus, stylistGradient } from '../components/stylist-ui';
import { formatDate, initials, statusColors, statusLabels, type AppointmentStatus } from '../models/stylist';
import { useStylistAppointmentDetailViewModel } from '../view-models/use-stylist-appointment-detail-view-model';

const progressSteps: AppointmentStatus[] = ['pending', 'confirmed', 'completed'];

export function StylistAppointmentDetailScreen() {
  const { refresh, refreshing, appointment, action, setAction, contact, setContact, feedback, actionError, busy, isActive, nextStatus,
    actionLabels, performAction, openContact, chooseAction, chooseContact } = useStylistAppointmentDetailViewModel();

  if (!appointment) return <AppScreen contentContainerStyle={styles.screen} onRefresh={refresh} refreshing={refreshing}>
    <StylistHeader onRefresh={refresh} title="Detalle de cita" back />
    <StylistEmpty title="Cita no encontrada" description="Esta reservación no está disponible en la vista actual."
      actionLabel="Ver citas" onAction={() => router.replace('/stylist/appointments')} />
  </AppScreen>;

  return <AppScreen contentContainerStyle={styles.screen} onRefresh={refresh} refreshing={refreshing}>
    <StylistHeader onRefresh={refresh} title="Detalle de cita" subtitle="Módulo Estilista" back />
    <StylistStatus status={appointment.status} />
    {feedback ? <StylistNotice tone="success">{feedback}</StylistNotice> : null}
    <StylistCard>
      <View style={styles.row}>
        <View style={styles.serviceIcon}><Ionicons name="cut-outline" size={23} color={palette.secondaryBright} /></View>
        <AppText variant="subtitle" style={styles.grow}>{appointment.service}</AppText>
      </View>
      <View style={styles.meta}>
        <Ionicons name="calendar-outline" size={16} color={palette.textMuted} />
        <AppText variant="caption" style={styles.grow}>{formatDate(appointment.date, { weekday: 'short', day: 'numeric', month: 'short' })} · {appointment.start}</AppText>
        <Ionicons name="time-outline" size={16} color={palette.textMuted} />
        <AppText tone="muted" variant="caption">{appointment.duration} min{appointment.durationEstimated ? ' aprox.' : ''}</AppText>
      </View>
      <View style={styles.meta}>
        <AppText variant="caption" style={{ color: appointment.assigned ? palette.primary : '#92400E' }}>
          {appointment.assigned ? 'Asignada a ti' : 'Sin estilista asignado'}
        </AppText>
        {appointment.updatedAt ? <AppText tone="muted" variant="caption">Actualizada {new Date(appointment.updatedAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</AppText> : null}
      </View>
    </StylistCard>
    <StylistCard>
      <View style={styles.row}>
        <LinearGradient colors={stylistGradient} style={styles.avatar}>
          <AppText tone="inverse" variant="subtitle">{initials(appointment.client)}</AppText>
        </LinearGradient>
        <View style={styles.grow}>
          <AppText variant="label">{appointment.client}</AppText>
          <AppText tone="muted" variant="caption">{appointment.phone}</AppText>
          <AppText tone="muted" variant="caption">{appointment.email}</AppText>
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.grow}><StylistButton label="Llamar" variant="outline" disabled={!appointment.phone} onPress={() => chooseContact('call')} /></View>
        <View style={styles.grow}><StylistButton label="Mensaje" variant="outline" disabled={!appointment.phone && !appointment.email} onPress={() => chooseContact('message')} /></View>
      </View>
    </StylistCard>
    <StylistCard>
      <View style={styles.row}>
        <Ionicons name="warning-outline" size={23} color="#B45309" />
        <AppText variant="label" style={styles.grow}>Notas del cliente · Atención</AppText>
      </View>
      <AppText tone="muted" variant="caption">{appointment.notes || 'El cliente no agregó notas a esta cita.'}</AppText>
    </StylistCard>
    <StylistCard>
      <AppText variant="label">Estado de la cita</AppText>
      {appointment.status === 'cancelled' ? <StylistNotice tone="error">Esta cita fue cancelada y ya no ocupa un espacio en tu agenda.</StylistNotice> :
        <View style={styles.progress}>
          {progressSteps.map((status, index) => {
            const reached = index <= progressSteps.indexOf(appointment.status);
            return <View key={status} style={styles.progressStep}>
              <View style={[styles.progressLine, { backgroundColor: reached ? statusColors[status].color : palette.border }]} />
              <View style={[styles.progressCircle, { borderColor: statusColors[status].color, backgroundColor: reached ? statusColors[status].background : palette.white }]}>
                {reached ? <Ionicons name="checkmark" size={14} color={statusColors[status].color} /> : null}
              </View>
              <AppText variant="caption" style={[styles.progressLabel, reached && { color: statusColors[status].color, fontWeight: '700' }]}>{statusLabels[status]}</AppText>
            </View>;
          })}
        </View>}
    </StylistCard>
    {isActive ? <>
      {!appointment.assigned ? <StylistNotice>Al confirmar esta cita quedará asignada a ti.</StylistNotice> : null}
      <StylistButton label={actionLabels[nextStatus]} disabled={busy} onPress={() => chooseAction(nextStatus)} />
      <View style={styles.row}>
        <View style={styles.grow}><StylistButton label="Cambiar estado" variant="outline" disabled={busy} onPress={() => chooseAction('choose')} /></View>
        <View style={styles.grow}><StylistButton label="Cancelar cita" variant="danger" disabled={busy} onPress={() => chooseAction('cancelled')} /></View>
      </View>
    </> : <StylistNotice tone={appointment.status === 'completed' ? 'success' : 'info'}>
      {appointment.status === 'completed' ? 'Este servicio ya forma parte de tu historial.' : 'Puedes volver a Citas para revisar otras reservaciones.'}
    </StylistNotice>}

    <StylistModal visible={Boolean(action)} title={action === 'choose' ? 'Cambiar estado' : action ? actionLabels[action] : ''} onClose={() => { if (!busy) setAction(null); }}>
      {actionError ? <StylistNotice tone="error">{actionError}</StylistNotice> : null}
      {action === 'choose' ? <>
        <AppText tone="muted">Selecciona la siguiente acción para esta cita.</AppText>
        <StylistButton label={actionLabels[nextStatus]} onPress={() => setAction(nextStatus)} />
        <StylistButton label="Cancelar cita" variant="danger" onPress={() => setAction('cancelled')} />
      </> : <>
        <AppText>{appointment.client} · {appointment.service}</AppText>
        <AppText tone="muted">{action === 'cancelled'
          ? 'La reservación quedará cancelada y su horario volverá a estar disponible.'
          : action === 'completed' ? 'El servicio se marcará como finalizado y aparecerá en Servicios realizados.'
            : 'La reservación quedará confirmada y asignada a ti.'}</AppText>
        <StylistButton disabled={busy} label={busy ? 'Guardando…' : action ? actionLabels[action] : 'Continuar'} variant={action === 'cancelled' ? 'danger' : 'primary'} onPress={() => { void performAction(); }} />
      </>}
      <StylistButton label="Volver" disabled={busy} variant="outline" onPress={() => setAction(null)} />
    </StylistModal>
    <StylistModal visible={Boolean(contact)} title={contact === 'call' ? 'Llamar al cliente' : 'Mensaje al cliente'} onClose={() => setContact(null)}>
      <AppText variant="label">{appointment.client}</AppText>
      <AppText>{appointment.phone || appointment.email}</AppText>
      <StylistNotice>Se abrirá la aplicación de {contact === 'call' ? 'teléfono' : 'mensajes'} de tu dispositivo.</StylistNotice>
      {actionError ? <StylistNotice tone="error">{actionError}</StylistNotice> : null}
      <StylistButton label="Continuar" onPress={() => { void openContact(); }} />
    </StylistModal>
  </AppScreen>;
}

const styles = StyleSheet.create({
  screen: { gap: 12 },
  grow: { flex: 1, minWidth: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 7, justifyContent: 'space-between' },
  serviceIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3EEFF', justifyContent: 'center', alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  progress: { flexDirection: 'row', paddingTop: 10, paddingBottom: 6 },
  progressStep: { flex: 1, alignItems: 'center', gap: 10 },
  progressLine: { position: 'absolute', top: 10, height: 2, width: '100%' },
  progressCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  progressLabel: { color: palette.textMuted, fontSize: 10 },
});
