import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/shared/components/app-icon';
import { palette } from '@/shared/theme/tokens';
import type { AppIconName } from '@/shared/types/icons';

export type ModuleTab = {
  icon: AppIconName;
  name: string;
  title: string;
};

type ModuleTabsProps = {
  tabs: readonly ModuleTab[];
  hiddenRoutes?: readonly string[];
};

export function ModuleTabs({ tabs, hiddenRoutes = [] }: ModuleTabsProps) {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        sceneStyle: styles.scene,
        tabBarActiveTintColor: palette.primary,
        tabBarHideOnKeyboard: true,
        tabBarInactiveTintColor: palette.textMuted,
        tabBarLabelStyle: styles.label,
        tabBarStyle: [styles.tabBar, { height: 64 + insets.bottom, paddingBottom: Math.max(insets.bottom, 6) }],
      }}>
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarAccessibilityLabel: tab.title,
            tabBarIcon: ({ color }) => <AppIcon color={color} name={tab.icon} size={23} />,
          }}
        />
      ))}
      {hiddenRoutes.map((name) => <Tabs.Screen key={name} name={name} options={{ href: null }} />)}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  scene: {
    backgroundColor: palette.background,
  },
  tabBar: {
    backgroundColor: palette.surface,
    borderTopColor: palette.border,
    paddingTop: 6,
  },
  label: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
  },
});
