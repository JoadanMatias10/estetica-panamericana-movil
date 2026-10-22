import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, radius, spacing } from '@/shared/theme/tokens';

type CatalogStatusProps = {
  kind: 'loading' | 'error' | 'empty';
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
  icon?: string;
};

export function CatalogStatus({
  kind,
  title,
  message,
  actionLabel,
  onAction,
  compact = false,
}: CatalogStatusProps) {
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.container, compact && styles.compact]}
    >
      {kind === 'loading' ? (
        <ActivityIndicator accessibilityLabel={title} color={palette.secondary} size="small" />
      ) : (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[styles.symbol, kind === 'error' && styles.errorSymbol]}
        >
          <Text style={[styles.symbolText, kind === 'error' && styles.errorSymbolText]}>
            {kind === 'error' ? '!' : '·'}
          </Text>
        </View>
      )}

      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 180,
    padding: spacing.xl,
  },
  compact: {
    minHeight: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  symbol: {
    alignItems: 'center',
    backgroundColor: '#F0EAFE',
    borderRadius: radius.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  errorSymbol: {
    backgroundColor: '#FDECEC',
  },
  symbolText: {
    color: palette.secondary,
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 28,
  },
  errorSymbolText: {
    color: palette.error,
  },
  title: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    color: palette.textMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  action: {
    alignItems: 'center',
    borderColor: palette.secondary,
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: spacing.xs,
    minHeight: 44,
    paddingHorizontal: spacing.lg,
  },
  actionText: {
    color: palette.secondary,
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
});
