import { StyleSheet } from 'react-native';

import { layout, palette, radius, spacing } from '@/shared/theme/tokens';

export const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { alignItems: 'center', alignSelf: 'center', flexDirection: 'row', justifyContent: 'space-between', maxWidth: layout.contentMaxWidth, minHeight: 56, paddingHorizontal: layout.screenPadding, width: '100%' },
  iconButton: { alignItems: 'center', height: layout.minimumTouchTarget, justifyContent: 'center', width: layout.minimumTouchTarget },
  headerTitle: { color: palette.text, flex: 1, fontSize: 17, fontWeight: '700', textAlign: 'center' },
  headerSpacer: { width: layout.minimumTouchTarget },
  content: { alignSelf: 'center', gap: spacing.xl, maxWidth: layout.contentMaxWidth, paddingBottom: spacing.xxl, paddingHorizontal: layout.screenPadding, width: '100%' },
  intro: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, paddingTop: spacing.md },
  shieldIcon: { alignItems: 'center', backgroundColor: '#F1EAFE', borderRadius: radius.pill, height: 52, justifyContent: 'center', width: 52 },
  introCopy: { flex: 1, gap: 3 },
  introTitle: { color: palette.text, fontSize: 17, fontWeight: '700', lineHeight: 24 },
  introText: { color: palette.textMuted, fontSize: 14, lineHeight: 21 },
  lastUpdated: { color: palette.textMuted, fontSize: 12, lineHeight: 18 },
  contactCard: { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: radius.lg, borderWidth: 1, gap: spacing.sm, padding: spacing.lg },
  section: { gap: spacing.md },
  sectionTitle: { color: palette.text, fontSize: 18, fontWeight: '700', lineHeight: 26 },
  body: { color: palette.text, fontSize: 15, lineHeight: 24 },
  listItem: { flexDirection: 'row', gap: spacing.sm },
  bullet: { color: palette.primary, fontSize: 18, lineHeight: 24 },
  listCopy: { flex: 1 },
  primaryButton: { alignItems: 'center', backgroundColor: palette.primary, borderRadius: radius.pill, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', minHeight: 48, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  primaryButtonText: { color: palette.white, flexShrink: 1, fontSize: 14, fontWeight: '700', textAlign: 'center' },
  secondaryButton: { alignItems: 'center', backgroundColor: palette.surface, borderColor: palette.secondary, borderRadius: radius.pill, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', minHeight: 48, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  secondaryButtonText: { color: palette.secondary, flexShrink: 1, fontSize: 14, fontWeight: '700', textAlign: 'center' },
  error: { color: palette.error, fontSize: 14, lineHeight: 22 },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.75 },
});
