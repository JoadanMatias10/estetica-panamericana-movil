import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppButton } from '@/shared/components/app-button';
import { AppCard } from '@/shared/components/app-card';
import { AppText } from '@/shared/components/app-text';
import { palette, radius, spacing } from '@/shared/theme/tokens';

export function ClientLoadingState({ label = 'Cargando información...' }: { label?: string }) {
  return (
    <View accessibilityLiveRegion="polite" style={styles.centered}>
      <ActivityIndicator color={palette.secondary} size="large" />
      <AppText tone="muted">{label}</AppText>
    </View>
  );
}

type ClientResourceMessageProps = {
  actionLabel?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  message: string;
  onAction?: () => void;
  title: string;
  tone?: 'default' | 'error';
};

export function ClientResourceMessage({
  actionLabel,
  icon = 'information-circle-outline',
  message,
  onAction,
  title,
  tone = 'default',
}: ClientResourceMessageProps) {
  const error = tone === 'error';
  return (
    <AppCard style={[styles.card, error && styles.errorCard]}>
      <View style={[styles.icon, error && styles.errorIcon]}>
        <Ionicons color={error ? palette.error : palette.secondary} name={icon} size={28} />
      </View>
      <AppText style={styles.centerText} variant="subtitle">
        {title}
      </AppText>
      <AppText style={styles.centerText} tone="muted">
        {message}
      </AppText>
      {onAction && actionLabel ? <AppButton label={actionLabel} onPress={onAction} variant="secondary" /> : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    gap: spacing.md,
    justifyContent: 'center',
    minHeight: 220,
  },
  card: {
    alignItems: 'center',
    gap: spacing.md,
  },
  errorCard: {
    backgroundColor: '#FFF7F7',
    borderColor: '#FECACA',
  },
  icon: {
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    borderRadius: radius.pill,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  errorIcon: {
    backgroundColor: '#FEE2E2',
  },
  centerText: {
    textAlign: 'center',
  },
});
