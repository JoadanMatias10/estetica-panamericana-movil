import { AppScreen } from '@/shared/components/app-screen';
import { AppText } from '@/shared/components/app-text';
import { ScrollView, StyleSheet, View } from 'react-native';
import { StylistAppointmentCard } from '../components/stylist-appointment-card';
import { StylistButton, StylistChip, StylistEmpty, StylistHeader, StylistModal, StylistNotice, StylistSearch } from '../components/stylist-ui';
import { formatDate } from '../models/stylist';
import { useStylistAppointmentsViewModel } from '../view-models/use-stylist-appointments-view-model';

export function StylistAppointmentsScreen() {
  const { filters, periods, refresh, lastUpdated, busy, refreshing, search, setSearch, status, setStatus, period, setPeriod, periodOpen, setPeriodOpen, action, setAction, feedback, actionError, setActionError, performAction, filtered } = useStylistAppointmentsViewModel();
  return <AppScreen contentContainerStyle={styles.screen} onRefresh={refresh} refreshing={refreshing}>
    <StylistHeader title="Citas asignadas" subtitle={formatDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long' })} onRefresh={refresh} />
    <StylistSearch value={search} onChangeText={setSearch} />
    <StylistButton label={`${periods.find((item) => item.value === period)?.label}  ▾`} variant="outline" onPress={() => setPeriodOpen(true)} />
    <ScrollView horizontal style={styles.filterScroller} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
      {filters.map((filter) => <StylistChip key={filter.value} label={filter.label} selected={filter.value === status} onPress={() => setStatus(filter.value)} />)}
    </ScrollView>
    <View style={styles.count}>
      <AppText tone="muted" variant="caption">{filtered.length} {filtered.length === 1 ? 'cita' : 'citas'}</AppText>
      <AppText tone="muted" variant="caption">Vista actualizada {new Date(lastUpdated).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</AppText>
    </View>
    {feedback ? <StylistNotice tone="success">{feedback}</StylistNotice> : null}
    {filtered.length ? filtered.map((appointment) => <StylistAppointmentCard key={appointment.id} appointment={appointment}
      onStatus={(item, nextStatus) => { setActionError(''); setAction({ appointment: item, status: nextStatus }); }} />)
      : <StylistEmpty title="No hay citas para mostrar" description="Prueba con otro nombre, estado o periodo."
        actionLabel="Limpiar filtros" onAction={() => { setSearch(''); setStatus('all'); setPeriod('all'); }} />}
    <StylistModal visible={periodOpen} title="Consultar citas" onClose={() => setPeriodOpen(false)}>
      {periods.map((item) => <StylistChip key={item.value} label={item.label} selected={period === item.value}
        onPress={() => { setPeriod(item.value); setPeriodOpen(false); }} />)}
    </StylistModal>
    <StylistModal visible={Boolean(action)} title={action?.status === 'confirmed' ? 'Confirmar cita' : 'Completar servicio'} onClose={() => { if (!busy) setAction(null); }}>
      <AppText>{action?.appointment.client} · {action?.appointment.service}</AppText>
      <AppText tone="muted">{action?.status === 'confirmed' ? 'La cita quedará confirmada y asignada a ti.' : 'El servicio aparecerá en tu historial de servicios realizados.'}</AppText>
      {actionError ? <StylistNotice tone="error">{actionError}</StylistNotice> : null}
      <StylistButton disabled={busy} label={busy ? 'Guardando…' : action?.status === 'confirmed' ? 'Sí, confirmar cita' : 'Sí, completar servicio'} onPress={() => { void performAction(); }} />
      <StylistButton disabled={busy} label="Volver" variant="outline" onPress={() => setAction(null)} />
    </StylistModal>
  </AppScreen>;

}

const styles = StyleSheet.create({
  screen: { gap: 12 },
  filterScroller: { flexGrow: 0, flexShrink: 0 },
  filters: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  count: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 6 },
});
