import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/app-text';
import { spacing } from '@/shared/theme/tokens';

type BrandHeaderProps = {
  action?: ReactNode;
  subtitle?: string;
  title?: string;
};

export function BrandHeader({ action, subtitle, title = 'Estética Panamericana' }: BrandHeaderProps) {
  return (
    <View style={styles.header}>
      <Image
        accessibilityLabel="Logotipo de Estética Panamericana"
        contentFit="contain"
        source={require('@/assets/images/brand-logo.png')}
        style={styles.logo}
      />
      <View style={styles.copy}>
        <AppText numberOfLines={1} variant="subtitle">
          {title}
        </AppText>
        {subtitle ? (
          <AppText numberOfLines={2} tone="muted" variant="caption">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 52,
  },
  logo: {
    height: 48,
    width: 48,
  },
  copy: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
});
