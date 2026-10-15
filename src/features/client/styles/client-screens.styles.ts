import { StyleSheet } from 'react-native';

import { layout, palette, radius, spacing } from '@/shared/theme/tokens';

export const clientScreenStyles = StyleSheet.create({
  actions: {
    gap: spacing.sm,
  },
  centered: {
    alignItems: 'center',
    gap: spacing.md,
    textAlign: 'center',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  column: {
    gap: spacing.md,
  },
  compactCard: {
    gap: spacing.sm,
  },
  dangerText: {
    color: palette.error,
  },
  divider: {
    backgroundColor: palette.border,
    height: StyleSheet.hairlineWidth,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    borderRadius: radius.pill,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  errorBox: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  fieldRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  flex: {
    flex: 1,
  },
  hero: {
    backgroundColor: '#F6EAFE',
    borderColor: '#E9D5FF',
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.md,
    overflow: 'hidden',
    padding: spacing.xl,
  },
  horizontalCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    borderRadius: radius.pill,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  image: {
    backgroundColor: palette.surfaceMuted,
    borderRadius: radius.lg,
    height: 220,
    width: '100%',
  },
  imageSmall: {
    backgroundColor: palette.surfaceMuted,
    borderRadius: radius.md,
    height: 76,
    width: 76,
  },
  input: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: palette.text,
    minHeight: layout.minimumTouchTarget,
    paddingHorizontal: spacing.md,
  },
  list: {
    gap: spacing.md,
  },
  metadata: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metric: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.xs,
    minWidth: 92,
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  mutedBox: {
    backgroundColor: palette.surfaceMuted,
    borderRadius: radius.md,
    gap: spacing.sm,
    padding: spacing.md,
  },
  pressable: {
    minHeight: layout.minimumTouchTarget,
  },
  price: {
    color: palette.primary,
    fontSize: 22,
    fontWeight: '800',
  },
  quantity: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  quantityButton: {
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    borderRadius: radius.pill,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  quickItem: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexBasis: '46%',
    flexGrow: 1,
    gap: spacing.sm,
    minHeight: 112,
    padding: spacing.md,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  rowBetween: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  scrollRow: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  horizontalScroller: {
    alignSelf: 'stretch',
    flexGrow: 0,
    flexShrink: 0,
  },
  section: {
    gap: spacing.md,
  },
  successBox: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  summaryLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  tabs: {
    backgroundColor: palette.surface,
    borderRadius: radius.pill,
    flexDirection: 'row',
    padding: spacing.xs,
  },
  tab: {
    alignItems: 'center',
    borderRadius: radius.pill,
    flex: 1,
    minHeight: 40,
    padding: spacing.sm,
  },
  tabActive: {
    backgroundColor: palette.secondary,
  },
  warningBox: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
});
