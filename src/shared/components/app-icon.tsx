import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';
import { Text } from 'react-native';

import type { AppIconName } from '@/shared/types/icons';

type SymbolName = ComponentProps<typeof SymbolView>['name'];

const symbolNames: Record<AppIconName, SymbolName> = {
  home: { ios: 'house.fill', android: 'home', web: 'home' },
  services: { ios: 'scissors', android: 'content_cut', web: 'content_cut' },
  products: { ios: 'bag.fill', android: 'shopping_bag', web: 'shopping_bag' },
  more: { ios: 'ellipsis', android: 'more_horiz', web: 'more_horiz' },
  appointments: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' },
  profile: { ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' },
  agenda: { ios: 'calendar.badge.clock', android: 'event_note', web: 'event_note' },
  schedule: { ios: 'clock.fill', android: 'schedule', web: 'schedule' },
  notifications: { ios: 'bell.fill', android: 'notifications', web: 'notifications' },
  login: { ios: 'person.badge.key.fill', android: 'login', web: 'login' },
  info: { ios: 'info.circle.fill', android: 'info', web: 'info' },
  arrow: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
};

type AppIconProps = {
  color: ColorValue;
  name: AppIconName;
  size?: number;
};

export function AppIcon({ color, name, size = 24 }: AppIconProps) {
  return (
    <SymbolView
      fallback={<Text style={{ color, fontSize: size }}>•</Text>}
      name={symbolNames[name]}
      size={size}
      tintColor={color}
    />
  );
}
