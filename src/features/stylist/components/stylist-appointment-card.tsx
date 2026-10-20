import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/app-text';
import { palette } from '@/shared/theme/tokens';
import { formatDate, statusColors, type AppointmentStatus, type StylistAppointment } from '../models/stylist';
import { StylistButton, StylistCard, StylistStatus } from './stylist-ui';

export function openStylistAppointment(id: string) {
  router.push({ pathname: '/stylist/appointments/[id]', params: { id } });
}

export function StylistAppointmentCard({ appointment, compact = false, onStatus }: {
  appointment: StylistAppointment; compact?: boolean;
  onStatus?: (appointment: StylistAppointment, status: AppointmentStatus) => void;
}) {
  return <StylistCard style={{ borderLeftWidth: 3, borderLeftColor: statusColors[appointment.status].color }}>
    <View style={styles.row}>
      <View style={[styles.row, styles.grow]}>
        <Ionicons name="calendar-outline" size={15} color={statusColors[appointment.status].color} />
        <AppText variant="caption" style={styles.date}>{formatDate(appointment.date, { day: 'numeric', month: 'short' })} · {appointment.start}</AppText>
      </View>
      <StylistStatus status={appointment.status} />
    </View>
    <View style={styles.copy}>
      <AppText variant="label">{appointment.client}</AppText>
      {!compact ? <AppText tone="muted" variant="caption">{appointment.phone} · {appointment.email}</AppText> : null}
      <AppText variant="caption" style={styles.service}>{appointment.service}</AppText>
      <AppText tone="muted" variant="caption">{appointment.duration} min{appointment.durationEstimated ? ' aprox.' : ''}{!compact ? ` · ${appointment.assigned ? 'Asignada a ti' : 'Sin asignar'}` : ''}</AppText>
      {!compact && appointment.notes ? <AppText tone="muted" variant="caption" numberOfLines={2}>Notas: {appointment.notes}</AppText> : null}
    </View>
    <View style={styles.actions}>
      <View style={styles.grow}><StylistButton label="Ver detalle" variant="outline" onPress={() => openStylistAppointment(appointment.id)} /></View>
      {onStatus && (appointment.status === 'pending' || appointment.status === 'confirmed') ?
        <View style={styles.grow}><StylistButton label={appointment.status === 'pending' ? 'Confirmar' : 'Completar'}
          onPress={() => onStatus(appointment, appointment.status === 'pending' ? 'confirmed' : 'completed')} /></View> : null}
    </View>
  </StylistCard>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  grow: { flex: 1, minWidth: 0 },
  date: { fontWeight: '600' },
  copy: { gap: 4 },
  service: { color: palette.text, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 8 },
});
