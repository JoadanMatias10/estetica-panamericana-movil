import { AppScreen } from '@/shared/components/app-screen';
import { AppText } from '@/shared/components/app-text';
import { palette } from '@/shared/theme/tokens';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { StylistCard, StylistChip, StylistEmpty, StylistHeader, StylistNotice, StylistSection, StylistStatus } from '../components/stylist-ui';
import { clockLabel } from '../models/availability';
import { dateKey, formatDate, statusColors } from '../models/stylist';
import { useStylistAgendaViewModel } from '../view-models/use-stylist-agenda-view-model';

export function StylistAgendaScreen() {
  const { weekdayNames, refresh, refreshing, estimated, selectedDate, setSelectedDate, mode, setMode, selectedKey, agenda, counts, dates, periodLabel, movePeriod } = useStylistAgendaViewModel();
  return (
    <AppScreen contentContainerStyle={styles.screen} onRefresh={refresh} refreshing={refreshing}>
      <StylistHeader title="Agenda y calendario" onRefresh={refresh} subtitle={formatDate(selectedDate, { weekday: 'long', day: 'numeric', month: 'long' })} />
      <View style={styles.modeRow}>
        {([['day', 'Día'], ['week', 'Semana'], ['month', 'Mes']] as const).map(([value, label]) => (
          <View key={value} style={styles.flex}><StylistChip label={label} selected={mode === value} onPress={() => setMode(value)} /></View>
        ))}
      </View>
      <View style={styles.periodRow}>
        <Pressable accessibilityRole="button" accessibilityLabel="Periodo anterior" onPress={() => movePeriod(-1)} style={styles.arrow}><AppText style={styles.arrowText}>‹</AppText></Pressable>
        <AppText variant="label" style={styles.periodLabel}>{periodLabel}</AppText>
        <Pressable accessibilityRole="button" accessibilityLabel="Periodo siguiente" onPress={() => movePeriod(1)} style={styles.arrow}><AppText style={styles.arrowText}>›</AppText></Pressable>
        <StylistChip label="Hoy" onPress={() => setSelectedDate(new Date())} />
      </View>
      {mode !== 'day' && (
        <StylistCard style={styles.calendar}>
          {mode === 'month' && <View style={styles.weekLabels}>{weekdayNames.map((name) => <AppText key={name} variant="caption" tone="muted" style={styles.weekLabel}>{name}</AppText>)}</View>}
          <View style={styles.calendarGrid}>
            {dates.map((date) => {
              const key = dateKey(date);
              const selected = key === selectedKey;
              const count = counts.get(key) ?? 0;
              return (
                <View key={key} style={styles.dayCell}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${formatDate(date, { weekday: 'long', day: 'numeric', month: 'long' })}, ${count} citas`}
                    accessibilityState={{ selected }}
                    onPress={() => setSelectedDate(date)}
                    style={[styles.day, selected && styles.daySelected, mode === 'month' && date.getMonth() !== selectedDate.getMonth() && styles.otherMonth]}>
                    {mode === 'week' && <AppText style={[styles.weekday, selected && styles.white]}>{weekdayNames[(date.getDay() + 6) % 7]}</AppText>}
                    <AppText variant="label" style={[styles.dayNumber, selected && styles.white]}>{date.getDate()}</AppText>
                    <View style={[styles.count, selected && styles.selectedCount]}><AppText style={styles.countText}>{count || '–'}</AppText></View>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </StylistCard>
      )}
      <StylistCard style={styles.summary}>
        <View style={styles.summaryHeading}>
          <AppText variant="label">{formatDate(selectedDate, { weekday: 'long', day: 'numeric' })} · {agenda.appointments.length} citas</AppText>
          <AppText variant="caption" tone="muted">{agenda.freeCount} periodos libres</AppText>
        </View>
        <View style={styles.legend}>
          {(['pending', 'confirmed', 'completed', 'cancelled'] as const).map((status, index) => (
            <View key={status} style={[styles.legendItem, { backgroundColor: statusColors[status].background }]}><AppText style={[styles.legendText, { color: statusColors[status].color }]}>{['Pend.', 'Conf.', 'Comp.', 'Canc.'][index]}</AppText></View>
          ))}
        </View>
      </StylistCard>
      {estimated && <StylistNotice>Algunas citas no incluyen duración. Sus horas de fin y los periodos libres son aproximados.</StylistNotice>}
      <View style={styles.timelineSection}>
        <View style={styles.summaryHeading}>
          <StylistSection title="Agenda del día" />
          <AppText variant="caption" tone="muted">{agenda.workDay?.active ? `${agenda.workDay.start} – ${agenda.workDay.end}` : 'Día no laborable'}</AppText>
        </View>
        {!agenda.workDay?.active && <StylistNotice>Este día está marcado como no laborable. Puedes cambiarlo en Horario.</StylistNotice>}
        {agenda.rows.length === 0 ? <StylistEmpty title="Tu día está libre" description="No hay citas ni bloqueos para esta fecha." actionLabel="Ver horario" onAction={() => router.push('/stylist/schedule')} /> : agenda.rows.map((row) => {
          const appointment = row.appointment;
          const color = appointment ? statusColors[appointment.status].color : row.kind === 'free' ? '#CBD5E1' : '#A78BFA';
          return (
            <View key={`${row.kind}-${row.id}`} style={styles.timelineRow}>
              <AppText variant="caption" style={styles.time}>{clockLabel(row.start)}</AppText>
              <View style={styles.line}><View style={[styles.dot, { backgroundColor: color }]} /></View>
              {appointment ? (
                <Pressable accessibilityRole="button" accessibilityLabel={`Ver cita de ${appointment.client} a las ${appointment.start}`} onPress={() => router.push({ pathname: '/stylist/appointments/[id]', params: { id: appointment.id } })} style={[styles.appointmentCard, { borderLeftColor: color }]}>
                  <View style={styles.appointmentHeading}><AppText variant="label" style={styles.flex}>{appointment.client}</AppText><StylistStatus status={appointment.status} /></View>
                  <AppText variant="caption">{appointment.service}</AppText>
                  <View style={styles.summaryHeading}><AppText variant="caption" tone="muted">{appointment.duration} min{appointment.durationEstimated ? ' aprox.' : ''} · hasta {clockLabel(row.end)}</AppText><AppText style={styles.detail}>Ver detalle ›</AppText></View>
                </Pressable>
              ) : (
                <View style={[styles.freeCard, row.kind !== 'free' && styles.blockCard]}>
                  <AppText variant="caption" tone="muted" style={styles.center}>{row.title} · {clockLabel(row.start)}–{clockLabel(row.end)}</AppText>
                  {row.kind === 'free' && <AppText variant="caption" tone="muted">{row.end - row.start} min libres</AppText>}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </AppScreen>
  );

}

const styles = StyleSheet.create({
  screen: { gap: 14 },
  flex: { flex: 1 },
  modeRow: { flexDirection: 'row', gap: 6, padding: 4, borderRadius: 16, borderWidth: 1, borderColor: palette.border, backgroundColor: '#FFFFFF' },
  periodRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  periodLabel: { flex: 1, textAlign: 'center', fontSize: 13, textTransform: 'capitalize' },
  arrow: { width: 40, minHeight: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: palette.border },
  arrowText: { color: palette.secondary, fontSize: 28, lineHeight: 30 },
  calendar: { padding: 7, gap: 5 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.285714%', padding: 2 },
  day: { minHeight: 65, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: palette.border, borderRadius: 13, gap: 1, paddingVertical: 6 },
  daySelected: { backgroundColor: '#8338EC', borderColor: '#8338EC' },
  otherMonth: { opacity: 0.4 },
  weekday: { fontSize: 10, lineHeight: 14, color: palette.textMuted },
  dayNumber: { fontSize: 16 },
  white: { color: '#FFFFFF' },
  count: { minWidth: 22, paddingHorizontal: 5, borderRadius: 10, backgroundColor: '#F5F0FF', alignItems: 'center' },
  selectedCount: { backgroundColor: '#FFFFFF' },
  countText: { color: palette.secondary, fontSize: 10, lineHeight: 14, fontWeight: '700' },
  weekLabels: { flexDirection: 'row' },
  weekLabel: { width: '14.285714%', textAlign: 'center' },
  summary: { gap: 9, padding: 12 },
  summaryHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 7, flexWrap: 'wrap' },
  legend: { flexDirection: 'row', gap: 6 },
  legendItem: { flex: 1, borderRadius: 20, padding: 4, alignItems: 'center' },
  legendText: { fontSize: 11, lineHeight: 15, fontWeight: '600' },
  timelineSection: { gap: 10 },
  timelineRow: { flexDirection: 'row', gap: 9, alignItems: 'stretch' },
  time: { width: 39, paddingTop: 7, fontSize: 11, fontWeight: '600' },
  line: { width: 2, backgroundColor: '#E2E8F0', marginTop: 6, marginBottom: -16 },
  dot: { width: 8, height: 8, borderRadius: 4, marginLeft: -3, marginTop: 5 },
  appointmentCard: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderLeftWidth: 4, borderColor: palette.border, borderRadius: 13, padding: 11, gap: 5 },
  appointmentHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' },
  detail: { fontSize: 11, lineHeight: 17, color: palette.secondary, fontWeight: '700' },
  freeCard: { flex: 1, minHeight: 55, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderStyle: 'dashed', borderColor: palette.border, borderRadius: 13, padding: 10 },
  blockCard: { backgroundColor: '#F5F0FF', borderColor: '#DDD6FE' },
  center: { textAlign: 'center' },
});
