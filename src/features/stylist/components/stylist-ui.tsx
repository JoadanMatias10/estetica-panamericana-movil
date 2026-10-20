import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/shared/components/app-text';
import { palette, radius, spacing } from '@/shared/theme/tokens';
import { statusColors, statusLabels, type AppointmentStatus } from '../models/stylist';
import { useStylist } from '../view-models/stylist-provider';

export const stylistGradient = [palette.primaryBright, '#7C3AED'] as const;

export function StylistIconButton({ label, icon, onPress }: {
  label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}
      style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
      <Ionicons name={icon} size={21} color={palette.secondary} />
    </Pressable>
  );
}

export function StylistHeader({ title, subtitle, back = false, onRefresh }: {
  title: string; subtitle?: string; back?: boolean; onRefresh?: () => void;
}) {
  const { notificationsRead, refreshing, error, refresh } = useStylist();
  return (
    <View style={styles.headerGroup}>
      <View style={styles.header}>
        {back ? <StylistIconButton label="Regresar" icon="arrow-back" onPress={() =>
          router.canGoBack() ? router.back() : router.replace('/stylist')} /> : null}
        <Image source={require('@/assets/images/brand-logo.png')} contentFit="contain" style={styles.logo}
          accessibilityLabel="Estética Panamericana" />
        <View style={styles.grow}>
          <AppText variant="subtitle" style={styles.headerTitle}>{title}</AppText>
          {subtitle ? <AppText tone="muted" variant="caption">{subtitle}</AppText> : null}
        </View>
        {onRefresh ? <StylistIconButton label="Actualizar vista" icon="refresh" onPress={onRefresh} /> : null}
        {!back ? (
          <View>
            <StylistIconButton label="Ver notificaciones" icon="notifications-outline"
              onPress={() => router.navigate('/stylist/notifications' as Href)} />
            {!notificationsRead ? <View style={styles.notificationDot} /> : null}
          </View>
        ) : null}
      </View>
      {refreshing ? <View style={styles.previewLabel}><ActivityIndicator size="small" color={palette.secondary} /><AppText variant="caption" tone="muted">Actualizando…</AppText></View> : null}
      {error ? <><StylistNotice tone="error">{error} Se muestran los últimos datos cargados.</StylistNotice><StylistButton label="Reintentar" variant="outline" onPress={() => { void refresh(); }} /></> : null}
    </View>
  );
}

export function StylistCard({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle>; }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function StylistSection({ title, actionLabel, onAction }: {
  title: string; actionLabel?: string; onAction?: () => void;
}) {
  return (
    <View style={styles.section}>
      <AppText variant="label" style={styles.grow}>{title}</AppText>
      {actionLabel && onAction ? <Pressable accessibilityRole="button" onPress={onAction} style={styles.textAction}>
        <AppText style={styles.purpleText} variant="caption">{actionLabel}</AppText>
      </Pressable> : null}
    </View>
  );
}

export function StylistChip({ label, selected = false, onPress }: {
  label: string; selected?: boolean; onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress}
      style={({ pressed }) => [styles.chip, selected && styles.selectedChip, pressed && styles.pressed]}>
      <AppText variant="caption" style={[styles.chipText, selected && styles.selectedChipText]}>{label}</AppText>
    </Pressable>
  );
}

export function StylistStatus({ status }: { status: AppointmentStatus; }) {
  const colors = statusColors[status];
  return <View style={[styles.status, { backgroundColor: colors.background }]}>
    <AppText variant="caption" style={{ color: colors.color, fontWeight: '700' }}>{statusLabels[status]}</AppText>
  </View>;
}

export function StylistButton({ label, onPress, variant = 'primary', disabled = false }: {
  label: string; onPress: () => void; variant?: 'primary' | 'outline' | 'danger'; disabled?: boolean;
}) {
  const content = <AppText variant="label" style={[
    styles.buttonText, variant === 'primary' ? styles.white : variant === 'danger' ? styles.danger : styles.purpleText,
  ]}>{label}</AppText>;
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
      style={({ pressed }) => [styles.button, disabled && styles.disabled, pressed && styles.pressed]}>
      {variant === 'primary'
        ? <LinearGradient colors={stylistGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.buttonInner}>{content}</LinearGradient>
        : <View style={[styles.buttonInner, styles.outlineButton, variant === 'danger' && styles.dangerButton]}>{content}</View>}
    </Pressable>
  );
}

export function StylistNotice({ children, tone = 'info' }: PropsWithChildren<{
  tone?: 'info' | 'success' | 'warning' | 'error';
}>) {
  const colors = noticeColors[tone];
  return <View accessibilityLiveRegion="polite" style={[styles.notice, { backgroundColor: colors.background }]}>
    <Ionicons name={tone === 'success' ? 'checkmark-circle-outline' : 'information-circle-outline'} size={19} color={colors.color} />
    <AppText variant="caption" style={[styles.grow, { color: colors.color }]}>{children}</AppText>
  </View>;
}

export function StylistEmpty({ title, description, actionLabel, onAction }: {
  title: string; description: string; actionLabel?: string; onAction?: () => void;
}) {
  return <StylistCard style={styles.empty}>
    <View style={styles.emptyIcon}><Ionicons name="calendar-clear-outline" color={palette.primaryBright} size={32} /></View>
    <AppText variant="subtitle" style={styles.center}>{title}</AppText>
    <AppText tone="muted" style={styles.center}>{description}</AppText>
    {actionLabel && onAction ? <StylistButton label={actionLabel} onPress={onAction} /> : null}
  </StylistCard>;
}

export function StylistSearch({ value, onChangeText, placeholder = 'Cliente o servicio' }: {
  value: string; onChangeText: (value: string) => void; placeholder?: string;
}) {
  return <View style={styles.search}>
    <Ionicons name="search-outline" size={20} color={palette.textMuted} />
    <TextInput accessibilityLabel={placeholder} value={value} onChangeText={onChangeText}
      placeholder={placeholder} placeholderTextColor={palette.textMuted} style={styles.searchInput}
      autoCorrect={false} returnKeyType="search" />
    {value ? <Pressable accessibilityRole="button" accessibilityLabel="Limpiar búsqueda" onPress={() => onChangeText('')} style={styles.clearSearch}>
      <Ionicons name="close-circle" size={20} color={palette.textMuted} />
    </Pressable> : null}
  </View>;
}

export function StylistModal({ visible, title, onClose, children }: PropsWithChildren<{
  visible: boolean; title: string; onClose: () => void;
}>) {
  // Unmount closed dialogs so they cannot retain focus over another screen.
  if (!visible) return null;
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <SafeAreaView style={styles.modalOverlay}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalKeyboard}>
        <View accessibilityViewIsModal style={styles.modalPanel}>
          <View style={styles.section}>
            <AppText variant="subtitle" style={styles.grow}>{title}</AppText>
            <StylistIconButton label="Cerrar" icon="close" onPress={onClose} />
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.modalContent}>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </Modal>;
}

const noticeColors = {
  info: { color: '#6D28D9', background: '#F3EEFF' },
  success: { color: '#047857', background: '#D1FAE5' },
  warning: { color: '#92400E', background: '#FEF3C7' },
  error: { color: '#B91C1C', background: '#FEE2E2' },
};

const styles = StyleSheet.create({
  headerGroup: { gap: 8 },
  header: { alignItems: 'center', flexDirection: 'row', gap: 8, minHeight: 52 },
  headerTitle: { fontSize: 17, lineHeight: 23 },
  logo: { width: 34, height: 40 },
  grow: { flex: 1, minWidth: 0 },
  iconButton: { minWidth: 44, minHeight: 44, borderRadius: radius.pill, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center' },
  notificationDot: { position: 'absolute', right: 3, top: 1, width: 10, height: 10, borderRadius: 5, backgroundColor: palette.primaryBright, borderColor: palette.white, borderWidth: 2 },
  previewLabel: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  previewDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: palette.secondaryBright },
  previewText: { color: palette.textMuted, fontSize: 10 },
  card: { padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: '#E7E9F0', backgroundColor: palette.white, gap: 10, boxShadow: '0px 2px 7px rgba(45, 35, 70, 0.035)' },
  section: { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'space-between' },
  textAction: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
  purpleText: { color: palette.secondary, fontWeight: '700' },
  chip: { minHeight: 44, paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center' },
  selectedChip: { backgroundColor: palette.primaryBright, borderColor: palette.primaryBright },
  chipText: { color: palette.textMuted, fontWeight: '600' },
  selectedChipText: { color: palette.white },
  status: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  button: { borderRadius: radius.pill, overflow: 'hidden', minHeight: 44 },
  buttonInner: { minHeight: 44, paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill },
  outlineButton: { borderWidth: 1, borderColor: palette.secondaryBright, backgroundColor: palette.white },
  dangerButton: { borderColor: palette.error },
  buttonText: { textAlign: 'center', fontSize: 13 },
  white: { color: palette.white },
  danger: { color: palette.error },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: radius.md },
  empty: { padding: 24, gap: 16 },
  emptyIcon: { alignSelf: 'center', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 32, backgroundColor: '#FDF2F8' },
  center: { textAlign: 'center' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: palette.white, borderWidth: 1, borderColor: palette.border, borderRadius: radius.md, paddingLeft: 12, minHeight: 46 },
  searchInput: { flex: 1, minWidth: 0, minHeight: 46, paddingVertical: 10, color: palette.text, fontSize: 14 },
  clearSearch: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, padding: 20, backgroundColor: 'rgba(33, 24, 48, 0.4)' },
  modalKeyboard: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalPanel: { maxWidth: 480, maxHeight: '90%', width: '100%', padding: 20, borderRadius: radius.xl, backgroundColor: palette.white, gap: 12 },
  modalContent: { gap: 14, paddingBottom: 4 },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.45 },
});
