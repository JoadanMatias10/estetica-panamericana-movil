import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import type { ClientAppointment } from '@/features/client/models/client-appointment';
import { AppButton } from '@/shared/components/app-button';
import { AppCard } from '@/shared/components/app-card';
import { AppText } from '@/shared/components/app-text';
import { palette, radius, spacing } from '@/shared/theme/tokens';

import {
  canModifyAppointment,
  canPayAppointment,
  formatAppointmentTime,
  formatCalendarDate,
  formatClientPrice,
} from './client-appointment-helpers';

type ClientAppointmentCardProps = {
  appointment: ClientAppointment;
  busy?: boolean;
  onCancel?: (appointment: ClientAppointment) => void;
  onPay?: (appointment: ClientAppointment) => void;
  onReschedule?: (appointment: ClientAppointment) => void;
};

const statusColors = {
  cancelada: palette.error,
  completada: palette.success,
  confirmada: palette.secondary,
  pendiente: palette.warning,
} as const;

export function ClientAppointmentCard({
  appointment,
  busy = false,
  onCancel,
  onPay,
  onReschedule,
}: ClientAppointmentCardProps) {
  const canModify = canModifyAppointment(appointment);
  const canPay = canPayAppointment(appointment);

  return (
    <AppCard accentColor={statusColors[appointment.status]} style={styles.card}>
      <View style={styles.headingRow}>
        <View style={styles.headingCopy}>
          <AppText numberOfLines={2} variant="subtitle">{appointment.serviceName || 'Servicio reservado'}</AppText>
          <AppText tone="muted" variant="caption">
            {formatCalendarDate(appointment.dateTime)} · {formatAppointmentTime(appointment.dateTime)}
          </AppText>
        </View>
        <View style={[styles.status, { backgroundColor: `${statusColors[appointment.status]}18` }]}>
          <AppText style={{ color: statusColors[appointment.status] }} variant="caption">
            {appointment.status.charAt(0).toLocaleUpperCase('es-MX') + appointment.status.slice(1)}
          </AppText>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Ionicons color={palette.textMuted} name="time-outline" size={17} />
          <AppText tone="muted">{appointment.durationMinutes} minutos</AppText>
        </View>
        <View style={styles.detailRow}>
          <Ionicons color={palette.textMuted} name="wallet-outline" size={17} />
          <AppText tone="muted">
            {formatClientPrice(appointment.servicePrice)} · {appointment.paymentStatus}
          </AppText>
        </View>
        {appointment.notes ? (
          <View style={styles.detailRow}>
            <Ionicons color={palette.textMuted} name="document-text-outline" size={17} />
            <AppText numberOfLines={3} tone="muted">{appointment.notes}</AppText>
          </View>
        ) : null}
      </View>

      {canModify && (onReschedule || onCancel || (canPay && onPay)) ? (
        <View style={styles.actions}>
          {onReschedule ? (
            <AppButton
              disabled={busy}
              label="Reprogramar"
              onPress={() => onReschedule(appointment)}
              variant="secondary"
            />
          ) : null}
          {canPay && onPay ? (
            <AppButton disabled={busy} label="Pagar" onPress={() => onPay(appointment)} />
          ) : null}
          {onCancel ? (
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={() => onCancel(appointment)}
              style={({ pressed }) => [styles.cancel, (pressed || busy) && styles.pressed]}>
              <AppText style={styles.cancelText} variant="label">Cancelar cita</AppText>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  actions: {
    alignItems: 'stretch',
    gap: spacing.sm,
  },
  cancel: {
    alignItems: 'center',
    minHeight: 40,
    justifyContent: 'center',
  },
  cancelText: {
    color: palette.error,
  },
  card: {
    gap: spacing.lg,
  },
  details: {
    gap: spacing.sm,
  },
  detailRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headingCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  headingRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.55,
  },
  status: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
});

