import { AppScreen } from '@/shared/components/app-screen';
import { AppText } from '@/shared/components/app-text';
import { palette } from '@/shared/theme/tokens';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';
import { StylistButton, StylistCard, StylistChip, StylistHeader, StylistModal, StylistNotice, StylistSection } from '../components/stylist-ui';
import { dayValidation } from '../models/availability';
import { addDays, formatDate } from '../models/stylist';
import { useStylistScheduleViewModel } from '../view-models/use-stylist-schedule-view-model';
type ClockFieldProps = { label: string; value: string; onChangeText: (value: string) => void; optional?: boolean; };
function ClockField({ label, value, onChangeText, optional }: ClockFieldProps) {
  return (
    <View style={styles.field}>
      <AppText variant="caption" tone="muted">{label}</AppText>
      <TextInput accessibilityLabel={label} autoCorrect={false} autoCapitalize="none" value={value} onChangeText={onChangeText} placeholder={optional ? 'Sin descanso' : '09:00'} placeholderTextColor={palette.textSubtle} maxLength={5} style={styles.input} />
    </View>
  );
}

export function StylistScheduleScreen() {
  const { refresh, refreshing, blocks, busy, week, setWeek, draftDays, setDraftBlocks, draftBlocks, setDraftInterval, draftInterval, expanded, setExpanded, showAllBlocks, setShowAllBlocks, showBlockForm, setShowBlockForm, blockDate, setBlockDate, blockStart, setBlockStart, blockEnd, setBlockEnd, blockReason, setBlockReason, blockError, setBlockError, message, setMessage, weekAppointments, affected, dirty, visibleBlocks, weekLabel, changeDay, addBlock, save } = useStylistScheduleViewModel();
  return (
    <AppScreen contentContainerStyle={styles.screen} onRefresh={refresh} refreshing={refreshing}>
      <StylistHeader onRefresh={refresh} title="Horario de trabajo" subtitle={`Semana ${weekLabel}`} />
      <StylistCard style={styles.summaryCard}>
        <View style={styles.summaryTitle}>
          <Pressable accessibilityRole="button" accessibilityLabel="Semana anterior" style={styles.weekArrow} onPress={() => setWeek(addDays(week, -7))}><AppText style={styles.arrowText}>‹</AppText></Pressable>
          <View style={styles.flex}><AppText variant="label" style={styles.center}>Semana {weekLabel}</AppText><AppText variant="caption" tone="muted" style={styles.center}>{week.getFullYear()}</AppText></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Semana siguiente" style={styles.weekArrow} onPress={() => setWeek(addDays(week, 7))}><AppText style={styles.arrowText}>›</AppText></Pressable>
        </View>
        <View style={styles.stats}>
          <View style={[styles.stat, styles.lilac]}><AppText style={[styles.statNumber, styles.purple]}>{weekAppointments.length}</AppText><AppText style={styles.statLabel}>Total citas</AppText></View>
          <View style={[styles.stat, styles.yellow]}><AppText style={[styles.statNumber, styles.amber]}>{weekAppointments.filter((item) => item.status === 'pending').length}</AppText><AppText style={styles.statLabel}>Pendientes</AppText></View>
          <View style={[styles.stat, styles.green]}><AppText style={[styles.statNumber, styles.greenText]}>{weekAppointments.filter((item) => item.status === 'completed').length}</AppText><AppText style={styles.statLabel}>Completadas</AppText></View>
        </View>
      </StylistCard>
      <StylistCard style={styles.intervalCard}>
        <AppText variant="label">Intervalo entre horarios</AppText>
        <View style={styles.intervals}>{Array.from(new Set([30, 45, 60, 90, draftInterval])).sort((a, b) => a - b).map((value) => <View key={value} style={styles.flex}><StylistChip label={`${value} min`} selected={draftInterval === value} onPress={() => { setDraftInterval(value); setMessage(null); }} /></View>)}</View>
      </StylistCard>
      <View style={styles.sectionIntro}><AppText variant="label">Disponibilidad semanal</AppText><AppText variant="caption" tone="muted">Se repite cada semana</AppText></View>
      <StylistCard style={styles.daysCard}>
        {draftDays.map((day, index) => {
          const isExpanded = expanded === day.weekday;
          const validation = dayValidation(day);
          return (
            <View key={day.weekday} style={[styles.dayContainer, index < draftDays.length - 1 && styles.dayBorder]}>
              <View style={styles.dayRow}>
                <Pressable accessibilityRole="button" accessibilityLabel={`Editar horario de ${day.label}`} accessibilityState={{ expanded: isExpanded }} onPress={() => setExpanded(isExpanded ? null : day.weekday)} style={styles.dayDescription}>
                  <AppText variant="label" style={styles.dayName}>{day.label}</AppText>
                  <View style={styles.flex}>
                    <AppText variant="caption">{day.active ? `${day.start}–${day.end}` : 'No laborable'}</AppText>
                    <AppText style={styles.rest}>{day.active ? day.breakStart && day.breakEnd ? `Descanso ${day.breakStart}–${day.breakEnd}` : 'Sin descanso' : 'Activa para trabajar este día'}</AppText>
                  </View>
                </Pressable>
                <Switch accessibilityLabel={`${day.label} laborable`} value={day.active} onValueChange={(active) => changeDay(day.weekday, { active })} trackColor={{ false: '#E2E8F0', true: '#8338EC' }} thumbColor="#FFFFFF" />
                <Pressable accessibilityRole="button" accessibilityLabel={`${isExpanded ? 'Cerrar' : 'Editar'} ${day.label}`} accessibilityState={{ expanded: isExpanded }} onPress={() => setExpanded(isExpanded ? null : day.weekday)} style={styles.expandButton}><AppText tone="muted">{isExpanded ? '⌃' : '⌄'}</AppText></Pressable>
              </View>
              {isExpanded && <View style={styles.dayEditor}>
                {!day.active && <AppText variant="caption" tone="muted">Activa este día para aplicar sus horarios.</AppText>}
                <View style={styles.fields}><ClockField label={`Entrada · ${day.label}`} value={day.start} onChangeText={(start) => changeDay(day.weekday, { start })} /><ClockField label={`Salida · ${day.label}`} value={day.end} onChangeText={(end) => changeDay(day.weekday, { end })} /></View>
                <View style={styles.fields}><ClockField label="Inicio de descanso" value={day.breakStart} optional onChangeText={(breakStart) => changeDay(day.weekday, { breakStart })} /><ClockField label="Fin de descanso" value={day.breakEnd} optional onChangeText={(breakEnd) => changeDay(day.weekday, { breakEnd })} /></View>
                <View style={styles.sectionIntro}><AppText variant="caption" tone="muted">Formato de 24 horas: HH:mm</AppText><Pressable accessibilityRole="button" onPress={() => changeDay(day.weekday, { breakStart: '', breakEnd: '' })} style={styles.clearBreak}><AppText style={styles.link}>Sin descanso</AppText></Pressable></View>
                {validation && <AppText variant="caption" tone="error">{validation}</AppText>}
              </View>}
            </View>
          );
        })}
      </StylistCard>
      <StylistCard style={styles.blockSection}>
        <StylistSection title="Ausencias y bloqueos" actionLabel="+ Agregar" onAction={() => { setBlockError(''); setShowBlockForm(true); }} />
        {!draftBlocks.length && <AppText variant="caption" tone="muted">No tienes bloqueos. Agrega vacaciones, ausencias o un asunto personal.</AppText>}
        {visibleBlocks.map((block) => <View key={block.id} style={styles.blockRow}>
          <View style={styles.flex}><AppText variant="caption" style={styles.bold}>{formatDate(block.date, { day: 'numeric', month: 'short', year: 'numeric' })} · {block.endDate && block.endDate !== block.date ? `al ${formatDate(block.endDate, { day: 'numeric', month: 'short' })} · ` : ''}{block.allDay ? 'Todo el día' : `${block.start}–${block.end}`}</AppText><AppText variant="caption" tone="muted">{block.reason}</AppText></View>
          <Pressable accessibilityRole="button" accessibilityLabel={`Eliminar bloqueo del ${block.date} a las ${block.start}`} style={styles.removeBlock} onPress={() => { setDraftBlocks((current) => (current ?? blocks).filter((item) => item.id !== block.id)); setMessage(null); }}><AppText style={styles.removeText}>Quitar</AppText></Pressable>
        </View>)}
        {draftBlocks.length > 2 && <Pressable accessibilityRole="button" style={styles.moreBlocks} onPress={() => setShowAllBlocks((value) => !value)}><AppText style={styles.link}>{showAllBlocks ? 'Ver menos' : `Ver ${draftBlocks.length - 2} bloqueos más`}</AppText></Pressable>}
      </StylistCard>
      {affected.length > 0 && <View style={styles.warning}>
        <AppText variant="label" style={styles.amber}>{affected.length} {affected.length === 1 ? 'cita podría verse afectada' : 'citas podrían verse afectadas'}</AppText>
        <AppText variant="caption" style={styles.amber}>Coinciden con descansos, bloqueos u horas no laborables. Guardar no modifica ni cancela estas citas.</AppText>
        {affected.slice(0, 3).map((appointment) => <Pressable key={appointment.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/stylist/appointments/[id]', params: { id: appointment.id } })} style={styles.affectedRow}><AppText variant="caption" style={styles.amber}>{appointment.client} · {formatDate(appointment.date, { day: 'numeric', month: 'short' })}, {appointment.start} ›</AppText></Pressable>)}
        {affected.length > 3 && <AppText variant="caption" style={styles.amber}>Y {affected.length - 3} citas más.</AppText>}
      </View>}
      {dirty && <AppText variant="caption" tone="muted" style={styles.center}>Tienes cambios sin guardar</AppText>}
      {message && <StylistNotice tone={message.error ? 'error' : 'success'}>{message.text}</StylistNotice>}
      <StylistButton label={busy ? "Guardando…" : "Guardar disponibilidad"} disabled={busy || !dirty} onPress={() => { void save(); }} />
      <AppText variant="caption" tone="muted" style={styles.center}>Los cambios se aplican a tu disponibilidad semanal.</AppText>
      <StylistModal visible={busy} title="Guardando disponibilidad" onClose={() => { }}><AppText>Espera la confirmación del servidor…</AppText></StylistModal>
      <StylistModal visible={showBlockForm} title="Agregar bloqueo" onClose={() => setShowBlockForm(false)}>
        <AppText variant="caption" tone="muted">Reserva un periodo en el que no podrás recibir citas.</AppText>
        <View style={styles.field}><AppText variant="caption" tone="muted">Fecha (YYYY-MM-DD)</AppText><TextInput accessibilityLabel="Fecha del bloqueo, año mes día" value={blockDate} onChangeText={setBlockDate} placeholder="2026-10-16" placeholderTextColor={palette.textSubtle} maxLength={10} autoCapitalize="none" autoCorrect={false} style={styles.input} /></View>
        <View style={styles.fields}><ClockField label="Desde" value={blockStart} onChangeText={setBlockStart} /><ClockField label="Hasta" value={blockEnd} onChangeText={setBlockEnd} /></View>
        <View style={styles.field}><AppText variant="caption" tone="muted">Motivo</AppText><TextInput accessibilityLabel="Motivo del bloqueo" value={blockReason} onChangeText={setBlockReason} placeholder="Ej. Asunto personal" placeholderTextColor={palette.textSubtle} maxLength={100} style={styles.input} /></View>
        {blockError ? <StylistNotice tone="error">{blockError}</StylistNotice> : null}
        <StylistButton label="Agregar a mi horario" onPress={addBlock} />
      </StylistModal>
    </AppScreen>
  );

}

const styles = StyleSheet.create({
  screen: { gap: 14 },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  summaryCard: { padding: 12, gap: 8 },
  summaryTitle: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  weekArrow: { minWidth: 40, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#FAF7FF' },
  arrowText: { fontSize: 27, lineHeight: 30, color: palette.secondary },
  stats: { flexDirection: 'row', gap: 7 },
  stat: { flex: 1, padding: 9, borderRadius: 11, gap: 1 },
  statNumber: { fontSize: 23, lineHeight: 28, fontWeight: '700' },
  statLabel: { fontSize: 10, lineHeight: 14, color: palette.textMuted },
  lilac: { backgroundColor: '#F4F0FF' },
  yellow: { backgroundColor: '#FEF3C7' },
  green: { backgroundColor: '#D1FAE5' },
  purple: { color: '#8338EC' },
  amber: { color: '#92400E' },
  greenText: { color: '#059669' },
  intervalCard: { padding: 12, gap: 9 },
  intervals: { flexWrap: 'wrap', flexDirection: 'row', gap: 6 },
  sectionIntro: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  daysCard: { padding: 0, overflow: 'hidden', gap: 0 },
  dayContainer: { paddingHorizontal: 11 },
  dayBorder: { borderBottomWidth: 1, borderBottomColor: palette.border },
  dayRow: { minHeight: 67, flexDirection: 'row', alignItems: 'center', gap: 4 },
  dayDescription: { flex: 1, minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 8 },
  dayName: { width: 70, fontSize: 12 },
  rest: { fontSize: 10, lineHeight: 14, color: palette.textMuted },
  expandButton: { minHeight: 44, width: 28, alignItems: 'center', justifyContent: 'center' },
  dayEditor: { gap: 10, paddingTop: 3, paddingBottom: 14 },
  fields: { flexDirection: 'row', gap: 10 },
  field: { flex: 1, gap: 5 },
  input: { minHeight: 44, borderWidth: 1, borderColor: palette.border, borderRadius: 10, backgroundColor: '#FFFFFF', paddingHorizontal: 11, paddingVertical: 10, color: palette.text, fontSize: 14 },
  clearBreak: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 5 },
  link: { fontSize: 12, fontWeight: '700', color: palette.secondary },
  blockSection: { padding: 12, gap: 10 },
  blockRow: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#F8FAFC', paddingLeft: 9, paddingVertical: 5, borderRadius: 10 },
  bold: { fontWeight: '600' },
  removeBlock: { minHeight: 44, minWidth: 48, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 7 },
  removeText: { fontSize: 11, color: palette.error, fontWeight: '600' },
  moreBlocks: { minHeight: 44, justifyContent: 'center', alignItems: 'flex-end' },
  warning: { backgroundColor: '#FFFBEB', borderColor: '#FBBF24', borderWidth: 1, borderRadius: 15, padding: 13, gap: 6 },
  affectedRow: { minHeight: 44, justifyContent: 'center', borderTopWidth: 1, borderTopColor: '#FDE68A', marginTop: 2 },
});
