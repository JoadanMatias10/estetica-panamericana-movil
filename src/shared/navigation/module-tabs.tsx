import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';

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
};

export function ModuleTabs({ tabs }: ModuleTabsProps) {
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
        tabBarStyle: styles.tabBar,
      }}>
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color }) => <AppIcon color={color} name={tab.icon} size={23} />,
          }}
        />
      ))}
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
    minHeight: 60,
    paddingBottom: 6,
    paddingTop: 6,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
  },
});
