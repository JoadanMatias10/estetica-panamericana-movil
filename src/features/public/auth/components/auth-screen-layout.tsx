import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, PropsWithChildren, ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppScreen } from '@/shared/components/app-screen';
import { AppText } from '@/shared/components/app-text';
import { BrandHeader } from '@/shared/components/brand-header';
import { palette, radius, spacing } from '@/shared/theme/tokens';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type AuthScreenLayoutProps = PropsWithChildren<{
  footer?: ReactNode;
  icon: IoniconName;
  onBack: () => void;
  subtitle: string;
  title: string;
}>;

export function AuthScreenLayout({
  children,
  footer,
  icon,
  onBack,
  subtitle,
  title,
}: AuthScreenLayoutProps) {
  return (
    <AppScreen contentContainerStyle={styles.screenContent}>
      <BrandHeader
        action={(
          <Pressable
            accessibilityLabel="Volver"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onBack}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Ionicons color={palette.text} name="arrow-back" size={22} />
          </Pressable>
        )}
        subtitle="Belleza y bienestar"
      />

      <View style={styles.heading}>
        <View style={styles.iconContainer}>
          <Ionicons color={palette.primary} name={icon} size={32} />
        </View>
        <AppText style={styles.centerText} variant="display">
          {title}
        </AppText>
        <AppText style={styles.centerText} tone="muted">
          {subtitle}
        </AppText>
      </View>

      <View style={styles.card}>{children}</View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    gap: spacing.lg,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  heading: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  iconContainer: {
    alignItems: 'center',
    backgroundColor: '#FCE7F3',
    borderColor: '#F9A8D4',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 68,
    justifyContent: 'center',
    marginBottom: spacing.xs,
    width: 68,
  },
  centerText: {
    textAlign: 'center',
  },
  card: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.xl,
    shadowColor: '#3F2947',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
  },
  footer: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  pressed: {
    opacity: 0.72,
  },
});
