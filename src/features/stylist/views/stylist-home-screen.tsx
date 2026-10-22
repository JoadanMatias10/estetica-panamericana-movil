import { AppScreen } from '@/shared/components/app-screen';
import { AppText } from '@/shared/components/app-text';
import { palette, radius } from '@/shared/theme/tokens';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { openStylistAppointment } from '../components/stylist-appointment-card';
import { StylistButton, StylistCard, StylistEmpty, StylistHeader, StylistSection, StylistStatus, stylistGradient } from '../components/stylist-ui';
import { formatDate, statusColors, type AppointmentStatus } from '../models/stylist';
import { useStylistHomeViewModel } from '../view-models/use-stylist-home-view-model';

export function StylistHomeScreen() {
  const { width, fontScale } = useWindowDimensions();
  const compact = width < 360 || fontScale > 1.15;
  const { shortcuts, identity, signOut, refresh, refreshing, now, today, activeToday, completed, next, recent, metrics } = useStylistHomeViewModel();
  return <AppScreen contentContainerStyle={styles.screen} onRefresh={refresh} refreshing={refreshing}>
    <View style={styles.welcome}>
      <View style={styles.grow}><StylistHeader title={`Hola, ${identity?.name.split(' ')[0] || 'Estilista'}`}
        subtitle={formatDate(now, { weekday: 'long', day: 'numeric', month: 'long' })} /></View>
      <LinearGradient colors={stylistGradient} style={styles.avatar}>
        <AppText tone="inverse" variant="label">{identity?.initials}</AppText>
      </LinearGradient>
    </View>
    <View style={styles.metrics}>
      {metrics.map((metric) => <StylistCard key={metric.label} style={[styles.metric, compact && styles.compactMetric]}>
        <View style={styles.metricTop}>
          <AppText style={[styles.metricValue, { color: metric.color }]}>{metric.value}</AppText>
          <View style={[styles.metricIcon, { backgroundColor: metric.background }]}>
            <Ionicons name={metric.icon} size={14} color={metric.color} />
          </View>
        </View>
        <AppText variant="caption" tone="muted" style={styles.metricLabel}>{metric.label}</AppText>
      </StylistCard>)}
    </View>

    {next ? <StylistCard style={styles.next}>
      <View style={styles.row}>
        <View style={[styles.row, styles.grow]}>
          <Ionicons name="calendar-outline" size={17} color={palette.primaryBright} />
          <AppText tone="muted" variant="caption" style={styles.eyebrow}>PRÓXIMA CITA</AppText>
        </View>
        <StylistStatus status={next.status} />
      </View>
      <AppText variant="subtitle">{next.start} · {next.client}</AppText>
      <AppText tone="muted" variant="caption">{next.service} · {next.duration} min{next.durationEstimated ? ' aprox.' : ''}</AppText>
      {next.date !== today ? <AppText tone="muted" variant="caption">{formatDate(next.date, { weekday: 'long', day: 'numeric', month: 'long' })}</AppText> : null}
      <StylistButton label="Ver cita" variant="outline" onPress={() => openStylistAppointment(next.id)} />
    </StylistCard> : <StylistEmpty title={activeToday.length ? 'Tu jornada está al día' : 'Hoy no tienes citas'}
      description="Revisa tu agenda para consultar otras fechas o preparar tus próximos servicios."
      actionLabel="Ir a mi agenda" onAction={() => router.navigate('/stylist/agenda')} />}

    <StylistSection title="Agenda de hoy" actionLabel="Ver agenda" onAction={() => router.navigate('/stylist/agenda')} />
    {activeToday.length ? <StylistCard style={styles.agenda}>
      {activeToday.map((item) => <Pressable accessibilityRole="button" accessibilityLabel={`Ver cita de ${item.client} a las ${item.start}`}
        key={item.id} onPress={() => openStylistAppointment(item.id)} style={({ pressed }) => [styles.agendaRow, pressed && styles.pressed]}>
        <AppText variant="caption" style={styles.time}>{item.start}</AppText>
        <View style={[styles.dot, { backgroundColor: statusColors[item.status].color }]} />
        <View style={styles.grow}>
          <AppText variant="caption" style={styles.bold}>{item.client}</AppText>
          <AppText variant="caption" tone="muted">{item.service}</AppText>
        </View>
        <StylistStatus status={item.status} />
      </Pressable>)}
    </StylistCard> : <StylistCard><AppText tone="muted">Día disponible. No hay reservaciones para hoy.</AppText></StylistCard>}

    <View style={styles.summary}>
      <StylistCard style={styles.summaryCard}>
        <Ionicons name="cut-outline" color="#047857" size={21} />
        <AppText variant="caption" style={styles.bold}>Servicios realizados hoy</AppText>
        <AppText variant="title" style={styles.green}>{completed.length}</AppText>
        <AppText variant="caption" tone="muted">{completed.map((item) => item.service).join(' · ') || 'Aún no hay servicios completados.'}</AppText>
      </StylistCard>
      <StylistCard style={styles.summaryCard}>
        <Ionicons name="pulse-outline" color={palette.primaryBright} size={21} />
        <AppText variant="caption" style={styles.bold}>Actividad reciente</AppText>
        {recent ? <>
          <AppText variant="caption">Cita {({ confirmed: 'confirmada', completed: 'completada', cancelled: 'cancelada', pending: 'pendiente' } satisfies Record<AppointmentStatus, string>)[recent.status]}</AppText>
          <AppText variant="caption" tone="muted">{recent.client}</AppText>
        </> : <AppText variant="caption" tone="muted">Sin actividad reciente.</AppText>}
      </StylistCard>
    </View>
    <StylistSection title="Accesos rápidos" />
    <View style={styles.shortcuts}>
      {shortcuts.map((item) => <Pressable key={item.href} accessibilityRole="button" onPress={() => router.navigate(item.href as Href)}
        style={({ pressed }) => [styles.shortcut, pressed && styles.pressed]}>
        <View style={[styles.shortcutIcon, { backgroundColor: item.background }]}><Ionicons name={item.icon} size={19} color={item.color} /></View>
        <AppText variant="caption" style={[styles.grow, styles.bold]}>{item.title}</AppText>
      </Pressable>)}
    </View>
    <StylistButton label="Cerrar sesión" variant="outline" onPress={() => { void signOut(); }} />
  </AppScreen>;

}

const styles = StyleSheet.create({
  screen: { gap: 12 },
  welcome: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  grow: { flex: 1, minWidth: 0 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metric: { flex: 1, minWidth: 0, padding: 8, gap: 4 },
  compactMetric: { flexBasis: '46%' },
  metricTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 },
  metricValue: { fontSize: 21, lineHeight: 28, fontWeight: '800' },
  metricIcon: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  metricLabel: { fontSize: 10, lineHeight: 15 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  next: { borderLeftWidth: 3, borderLeftColor: '#DB6BB5', padding: 14 },
  eyebrow: { fontWeight: '700', fontSize: 10 },
  agenda: { gap: 0 },
  agendaRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 8 },
  time: { fontWeight: '700', width: 37 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  bold: { fontWeight: '700' },
  summary: { flexDirection: 'row', gap: 8 },
  summaryCard: { flex: 1, minWidth: 0 },
  green: { color: '#047857' },
  shortcuts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  shortcut: { flexGrow: 1, flexBasis: '46%', minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, minHeight: 56, backgroundColor: palette.white, borderWidth: 1, borderColor: palette.border, borderRadius: radius.md },
  shortcutIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.7 },
});
