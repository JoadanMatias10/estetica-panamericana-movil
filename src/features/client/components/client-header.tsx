import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/app-text';
import { palette, radius, spacing } from '@/shared/theme/tokens';

type HeaderActionProps = {
  accessibilityLabel: string;
  badge?: number;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
};

function HeaderAction({ accessibilityLabel, badge = 0, icon, onPress }: HeaderActionProps) {
  if (!onPress) return null;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
      <Ionicons color={palette.text} name={icon} size={22} />
      {badge > 0 ? (
        <View style={styles.badge}>
          <AppText style={styles.badgeText} variant="caption">
            {badge > 99 ? '99+' : badge}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

type ClientHeaderProps = {
  cartCount?: number;
  compactTitle?: boolean;
  initials?: string;
  notificationCount?: number;
  onBack?: () => void;
  onCart?: () => void;
  onNotifications?: () => void;
  onProfile?: () => void;
  subtitle?: string;
  title: string;
};

export function ClientHeader({
  cartCount = 0,
  compactTitle = false,
  initials,
  notificationCount = 0,
  onBack,
  onCart,
  onNotifications,
  onProfile,
  subtitle,
  title,
}: ClientHeaderProps) {
  return (
    <View style={styles.container}>
      {onBack ? (
        <HeaderAction accessibilityLabel="Regresar" icon="chevron-back" onPress={onBack} />
      ) : null}

      <View style={styles.copy}>
        <AppText numberOfLines={1} style={compactTitle ? styles.compactTitle : undefined} variant="title">
          {title}
        </AppText>
        {subtitle ? (
          <AppText numberOfLines={2} tone="muted" variant="caption">
            {subtitle}
          </AppText>
        ) : null}
      </View>

      <View style={styles.actions}>
        <HeaderAction
          accessibilityLabel="Abrir carrito"
          badge={cartCount}
          icon="bag-handle-outline"
          onPress={onCart}
        />
        <HeaderAction
          accessibilityLabel="Abrir notificaciones"
          badge={notificationCount}
          icon="notifications-outline"
          onPress={onNotifications}
        />
        {onProfile ? (
          <Pressable
            accessibilityLabel="Abrir perfil"
            accessibilityRole="button"
            hitSlop={6}
            onPress={onProfile}
            style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}>
            <AppText style={styles.avatarText} variant="label">
              {initials || 'EP'}
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 52,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  compactTitle: {
    fontSize: 18,
    lineHeight: 23,
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  action: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    position: 'relative',
    width: 42,
  },
  badge: {
    alignItems: 'center',
    backgroundColor: palette.primary,
    borderColor: palette.surface,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    justifyContent: 'center',
    minHeight: 18,
    minWidth: 18,
    paddingHorizontal: 3,
    position: 'absolute',
    right: -4,
    top: -5,
  },
  badgeText: {
    color: palette.white,
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 12,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    borderColor: '#DDD6FE',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  avatarText: {
    color: palette.secondary,
  },
  pressed: {
    opacity: 0.7,
  },
});
