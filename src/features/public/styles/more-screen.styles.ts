import { StyleSheet } from 'react-native';

import { layout, palette, radius, spacing } from '@/shared/theme/tokens';

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    alignSelf: 'center',
    gap: spacing.xl,
    maxWidth: layout.contentMaxWidth,
    paddingBottom: spacing.xxl,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
    width: '100%',
  },
  heading: {
    gap: spacing.xs,
  },
  title: {
    color: palette.text,
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 34,
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  loginCard: {
    alignItems: 'center',
    borderColor: '#E7B5D2',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    padding: spacing.lg,
  },
  loginIcon: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: radius.pill,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  loginCopy: {
    flex: 1,
    gap: 2,
    minWidth: 180,
  },
  loginTitle: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },
  loginDescription: {
    color: palette.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  loginButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: palette.primary,
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: layout.minimumTouchTarget,
    paddingHorizontal: spacing.lg,
  },
  loginButtonText: {
    color: palette.white,
    fontSize: 13,
    fontWeight: '700',
  },
  options: {
    gap: spacing.md,
  },
  option: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 82,
    padding: spacing.lg,
  },
  optionIcon: {
    alignItems: 'center',
    backgroundColor: '#F2ECFC',
    borderRadius: radius.md,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  optionCopy: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  optionTitle: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  optionDescription: {
    color: palette.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.72,
  },
});
