import { AppScreen } from '@/shared/components/app-screen';
import { AppText } from '@/shared/components/app-text';
import { palette } from '@/shared/theme/tokens';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { StylistAppointmentCard } from '../components/stylist-appointment-card';
import {
  StylistButton, StylistCard, StylistChip, StylistEmpty, StylistHeader,
  StylistIconButton, StylistModal, StylistSearch, StylistSection,
} from '../components/stylist-ui';
import { formatDate } from '../models/stylist';
import { useStylistServicesViewModel } from '../view-models/use-stylist-services-view-model';

export function StylistServicesScreen() {
  const { periods, chartColors, periodDescription, refresh, refreshing, period, setPeriod, service, setService, query, setQuery, filtersOpen, setFiltersOpen, reference, completed, statistics, services, history, clients, topService, updatedTime, resetFilters } = useStylistServicesViewModel();
  return (
    <AppScreen contentContainerStyle={styles.screen} onRefresh={refresh} refreshing={refreshing}>
      <StylistHeader title="Servicios realizados" subtitle={formatDate(reference, { month: 'long', year: 'numeric' })} onRefresh={refresh} />
      <View style={styles.filterRow}>
        <Pressable accessibilityRole="button" accessibilityLabel="Seleccionar período y tipo de servicio"
          onPress={() => setFiltersOpen(true)} style={({ pressed }) => [styles.periodButton, pressed && styles.pressed]}>
          <AppText variant="caption" style={styles.periodLabel}>{periodDescription(period, reference)}</AppText>
          <Ionicons name="chevron-down" size={17} color={palette.secondary} />
        </Pressable>
        <StylistIconButton icon="options-outline" label="Filtrar servicios" onPress={() => setFiltersOpen(true)} />
      </View>

      <StylistCard>
        <View style={styles.heading}>
          <StylistSection title="Resumen del período" />
          <AppText variant="caption" tone="muted" style={styles.small}>Actualizado {updatedTime}</AppText>
        </View>
        <View style={styles.metrics}>
          <View style={[styles.metric, styles.purpleMetric]}>
            <AppText style={[styles.metricValue, styles.purple]}>{completed.length}</AppText>
            <AppText style={styles.metricCaption}>Total de servicios</AppText>
          </View>
          <View style={[styles.metric, styles.greenMetric]}>
            <AppText style={[styles.metricValue, styles.green]}>{clients}</AppText>
            <AppText style={styles.metricCaption}>Clientes atendidos</AppText>
          </View>
          <View style={[styles.metric, styles.pinkMetric]}>
            <AppText style={styles.topService}>{topService?.name ?? 'Sin servicios'}</AppText>
            <AppText style={styles.metricCaption}>{topService ? `Más frecuente · ${topService.count}` : 'En este período'}</AppText>
          </View>
        </View>
      </StylistCard>

      <StylistCard>
        <View style={styles.heading}>
          <StylistSection title="Servicios más realizados" />
          <AppText variant="caption" tone="muted">{completed.length} total</AppText>
        </View>
        {statistics.length > 0 ? statistics.slice(0, 3).map((item, index) => (
          <View key={item.name} style={styles.chartRow}>
            <AppText variant="caption" style={styles.chartLabel}>{item.name}</AppText>
            <View accessibilityRole="progressbar" accessibilityLabel={`${item.name}: ${item.count} servicios`}
              accessibilityValue={{ min: 0, max: topService.count, now: item.count }} style={styles.barTrack}>
              <View style={[styles.bar, { backgroundColor: chartColors[index], width: `${item.count / topService.count * 100}%` }]} />
            </View>
            <AppText variant="caption" style={[styles.chartCount, { color: chartColors[index] }]}>{item.count}</AppText>
          </View>
        )) : <AppText tone="muted" variant="caption">Las estadísticas aparecerán cuando tengas servicios completados en este período.</AppText>}
      </StylistCard>

      <StylistSearch value={query} onChangeText={setQuery} />
      {service ? <View style={styles.activeFilter}>
        <AppText variant="caption" style={styles.grow}>Servicio: {service}</AppText>
        <StylistIconButton label="Quitar filtro de servicio" icon="close" onPress={() => setService('')} />
      </View> : null}
      <View style={styles.heading}>
        <StylistSection title="Historial" />
        <AppText variant="caption" tone="muted">{history.length} {history.length === 1 ? 'completado' : 'completados'}</AppText>
      </View>
      {history.length > 0 ? history.map((appointment) => (
        <StylistAppointmentCard key={appointment.id} appointment={appointment} compact />
      )) : <StylistEmpty title="Sin servicios para mostrar" description="Prueba otro período o cambia los filtros de tu búsqueda."
        actionLabel="Ver todo el historial" onAction={resetFilters} />}

      <StylistModal visible={filtersOpen} title="Filtrar servicios" onClose={() => setFiltersOpen(false)}>
        <StylistSection title="Período" />
        <View style={styles.chips}>{periods.map((item) => <StylistChip key={item.value} label={item.label}
          selected={period === item.value} onPress={() => setPeriod(item.value)} />)}</View>
        <StylistSection title="Tipo de servicio" />
        <View style={styles.chips}>
          <StylistChip label="Todos los servicios" selected={!service} onPress={() => setService('')} />
          {services.map((name) => <StylistChip key={name} label={name} selected={service === name} onPress={() => setService(name)} />)}
        </View>
        <StylistButton label="Ver resultados" onPress={() => setFiltersOpen(false)} />
      </StylistModal>
    </AppScreen>
  );

}

const styles = StyleSheet.create({
  screen: { gap: 12 },
  grow: { flex: 1, minWidth: 0 },
  filterRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  periodButton: { flex: 1, minHeight: 46, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: palette.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: palette.white },
  periodLabel: { flex: 1, fontWeight: '600' },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', columnGap: 8, rowGap: 2 },
  small: { fontSize: 10 },
  metrics: { flexDirection: 'row', gap: 7 },
  metric: { flex: 1, minWidth: 0, padding: 9, borderRadius: 12, gap: 3 },
  purpleMetric: { backgroundColor: '#F5F0FF' },
  greenMetric: { backgroundColor: '#D1FAE5' },
  pinkMetric: { backgroundColor: '#FDF2F8' },
  metricValue: { fontSize: 22, lineHeight: 27, fontWeight: '800' },
  purple: { color: palette.secondaryBright },
  green: { color: '#059669' },
  metricCaption: { color: palette.textMuted, fontSize: 10, lineHeight: 14 },
  topService: { color: palette.primary, fontSize: 11, lineHeight: 15, fontWeight: '700' },
  chartRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 30 },
  chartLabel: { flex: 1, minWidth: 0, fontSize: 11 },
  barTrack: { flex: 1.3, backgroundColor: '#F3F4F6', height: 8, borderRadius: 6, overflow: 'hidden' },
  bar: { height: 8, borderRadius: 6 },
  chartCount: { minWidth: 20, textAlign: 'right', fontWeight: '700' },
  activeFilter: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingLeft: 12, paddingRight: 4, borderRadius: 12, backgroundColor: '#F3EEFF' },
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pressed: { opacity: 0.7 },
});
