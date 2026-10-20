import { AppScreen } from '@/shared/components/app-screen';
import { AppText } from '@/shared/components/app-text';
import { palette } from '@/shared/theme/tokens';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { openStylistAppointment } from '../components/stylist-appointment-card';
import {
  StylistButton, StylistCard, StylistEmpty, StylistHeader,
  StylistNotice, StylistSection, StylistStatus,
} from '../components/stylist-ui';
import { formatDate, statusColors } from '../models/stylist';
import { useStylistNotificationsViewModel } from '../view-models/use-stylist-notifications-view-model';

export function StylistNotificationsScreen() {
  const { activityDescriptions, appointmentTime, upcomingLabel, activityTime, notificationsRead, readAt, markNotificationsRead, lastUpdated, refresh, refreshing, now, upcoming, recent } = useStylistNotificationsViewModel();
  return (
    <AppScreen contentContainerStyle={styles.screen} onRefresh={refresh} refreshing={refreshing}>
      <StylistHeader title="Notificaciones" subtitle="Actividad de tus citas" back onRefresh={refresh} />
      {notificationsRead ? <StylistNotice tone="success">Tus notificaciones están marcadas como leídas.</StylistNotice>
        : <StylistButton label="Marcar como leídas" variant="outline" onPress={markNotificationsRead} />}
      <AppText variant="caption" tone="muted">La marca de lectura se conserva en este dispositivo.</AppText>

      <View style={styles.heading}>
        <StylistSection title="Próximas citas" />
        <AppText variant="caption" tone="muted">{upcoming.length} {upcoming.length === 1 ? 'próxima' : 'próximas'}</AppText>
      </View>
      {upcoming.length > 0 ? upcoming.map((appointment) => {
        const urgent = appointmentTime(appointment) - now.getTime() <= 60 * 60 * 1000;
        const color = urgent ? '#D97706' : palette.secondaryBright;
        return <StylistCard key={appointment.id} style={[styles.upcomingCard, { borderLeftColor: color, borderColor: urgent ? '#F59E0B' : palette.border }]}>
          <View style={styles.heading}>
            <View style={styles.relativeHeading}>
              <View style={[styles.relativeIcon, { backgroundColor: urgent ? '#FEF3C7' : '#F3EEFF' }]}>
                <Ionicons name={urgent ? 'alert-outline' : 'time-outline'} size={14} color={color} />
              </View>
              <AppText variant="caption" style={{ color, fontWeight: '700' }}>{upcomingLabel(appointment, now)}</AppText>
            </View>
            <StylistStatus status={appointment.status} />
          </View>
          <AppText variant="label">{appointment.client}</AppText>
          <AppText variant="caption">{appointment.service}</AppText>
          <View style={styles.heading}>
            <AppText variant="caption" tone="muted" style={styles.appointmentDate}>{formatDate(appointment.date, { day: 'numeric', month: 'short' })} · {appointment.start} · {appointment.duration} min{appointment.durationEstimated ? ' aprox.' : ''}</AppText>
            <Pressable accessibilityRole="button" accessibilityLabel={`Ver cita de ${appointment.client}`}
              onPress={() => openStylistAppointment(appointment.id)} style={styles.detailButton}>
              <AppText variant="caption" style={styles.detailText}>Ver detalle ›</AppText>
            </Pressable>
          </View>
        </StylistCard>;
      }) : <StylistEmpty title="Sin próximas citas" description="Aquí aparecerán tus citas pendientes o confirmadas que aún no han comenzado." />}

      <View style={styles.heading}>
        <StylistSection title="Actividad reciente" />
        <AppText variant="caption" tone="muted">Últimas 24 h</AppText>
      </View>
      {recent.length > 0 ? <StylistCard style={styles.activityCard}>
        {recent.map((appointment, index) => <View key={appointment.id} style={[styles.activityRow, index > 0 && styles.activityBorder]}>
          <View style={styles.timeline}>
            <View style={[styles.activityDot, { backgroundColor: statusColors[appointment.status].color }]} />
            {appointment.updatedAt > readAt ? <View accessibilityLabel="Sin leer" style={styles.unreadDot} /> : null}
          </View>
          <View style={styles.activityContent}>
            <View style={styles.heading}>
              <AppText variant="label" style={styles.clientName}>{appointment.client}</AppText>
              <StylistStatus status={appointment.status} />
            </View>
            <AppText variant="caption">{appointment.service}</AppText>
            <AppText variant="caption" tone="muted">{activityDescriptions[appointment.status]}</AppText>
            <View style={styles.heading}>
              <AppText variant="caption" tone="muted" style={styles.timestamp}>{activityTime(appointment.updatedAt, now)}</AppText>
              <Pressable accessibilityRole="button" accessibilityLabel={`Ver actividad de la cita de ${appointment.client}`}
                onPress={() => openStylistAppointment(appointment.id)} style={styles.detailButton}>
                <AppText variant="caption" style={styles.detailText}>Ver detalle ›</AppText>
              </Pressable>
            </View>
          </View>
        </View>)}
      </StylistCard> : <StylistEmpty title="Sin actividad reciente" description="No hay cambios en tus citas durante las últimas 24 horas." />}
      <AppText variant="caption" tone="muted" style={styles.updatedLabel}>
        Vista actualizada a las {formatDate(new Date(lastUpdated), { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </AppText>
    </AppScreen>
  );

}

const styles = StyleSheet.create({
  screen: { gap: 12 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', columnGap: 8, rowGap: 5 },
  upcomingCard: { borderLeftWidth: 5, gap: 7 },
  relativeHeading: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  relativeIcon: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  appointmentDate: { flexGrow: 1, flexShrink: 1, fontSize: 11 },
  detailButton: { minHeight: 44, paddingHorizontal: 5, justifyContent: 'center' },
  detailText: { color: palette.secondary, fontWeight: '700', fontSize: 11 },
  activityCard: { padding: 0, gap: 0, overflow: 'hidden' },
  activityRow: { flexDirection: 'row', gap: 13, padding: 13 },
  activityBorder: { borderTopWidth: 1, borderTopColor: palette.border },
  timeline: { width: 2, backgroundColor: '#E2E8F0', marginLeft: 6, marginTop: 5, marginBottom: 5 },
  activityDot: { width: 10, height: 10, borderRadius: 5, position: 'absolute', top: 4, left: -4 },
  unreadDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: palette.primaryBright, position: 'absolute', top: 0, left: 5 },
  activityContent: { flex: 1, minWidth: 0, gap: 5 },
  clientName: { fontSize: 12, flexGrow: 1, flexShrink: 1 },
  timestamp: { fontSize: 10, flexShrink: 1 },
  updatedLabel: { textAlign: 'center', fontSize: 10 },
});
