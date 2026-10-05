import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { palette, radius, spacing } from '@/shared/theme/tokens';

type AppCardProps = PropsWithChildren<{
  accentColor?: string;
  style?: StyleProp<ViewStyle>;
}>;

export function AppCard({ accentColor, children, style }: AppCardProps) {
  return (
    <View
      style={[
        styles.card,
        accentColor ? { borderLeftColor: accentColor, borderLeftWidth: 4 } : undefined,
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
});
