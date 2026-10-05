import { Pressable, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/shared/components/app-icon';
import { AppText } from '@/shared/components/app-text';
import { palette, radius, spacing } from '@/shared/theme/tokens';
import type { AppIconName } from '@/shared/types/icons';

type ActionTileProps = {
  description: string;
  icon: AppIconName;
  onPress: () => void;
  title: string;
};

export function ActionTile({ description, icon, onPress, title }: ActionTileProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
      <View style={styles.iconContainer}>
        <AppIcon color={palette.primary} name={icon} size={22} />
      </View>
      <View style={styles.copy}>
        <AppText variant="label">{title}</AppText>
        <AppText numberOfLines={2} tone="muted" variant="caption">
          {description}
        </AppText>
      </View>
      <AppIcon color={palette.textSubtle} name="arrow" size={19} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 88,
    padding: spacing.md,
  },
  iconContainer: {
    alignItems: 'center',
    backgroundColor: '#FDEAF4',
    borderRadius: radius.pill,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.99 }],
  },
});
