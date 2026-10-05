import { LinearGradient } from 'expo-linear-gradient';
import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/shared/components/app-icon';
import { AppText } from '@/shared/components/app-text';
import { gradients, layout, palette, radius, spacing } from '@/shared/theme/tokens';
import type { AppIconName } from '@/shared/types/icons';

type AppButtonProps = {
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: AppIconName;
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'primary' | 'secondary' | 'ghost';
};

export function AppButton({
  disabled = false,
  fullWidth = false,
  icon,
  label,
  onPress,
  style,
  variant = 'primary',
}: AppButtonProps) {
  const content = (
    <View style={styles.content}>
      {icon ? (
        <AppIcon color={variant === 'primary' ? palette.white : palette.primary} name={icon} size={19} />
      ) : null}
      <AppText tone={variant === 'primary' ? 'inverse' : 'primary'} variant="label">
        {label}
      </AppText>
    </View>
  );

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pressable,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}>
      {variant === 'primary' ? (
        <LinearGradient
          colors={gradients.brand}
          end={{ x: 1, y: 0 }}
          start={{ x: 0, y: 0 }}
          style={styles.inner}>
          {content}
        </LinearGradient>
      ) : (
        <View style={[styles.inner, variant === 'secondary' ? styles.secondary : styles.ghost]}>
          {content}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: radius.pill,
    minHeight: layout.minimumTouchTarget,
    overflow: 'hidden',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  inner: {
    alignItems: 'center',
    borderRadius: radius.pill,
    justifyContent: 'center',
    minHeight: layout.minimumTouchTarget,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  secondary: {
    backgroundColor: palette.surface,
    borderColor: palette.primary,
    borderWidth: 1.5,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.78,
  },
});
