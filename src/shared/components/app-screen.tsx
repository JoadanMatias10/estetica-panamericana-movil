import { LinearGradient } from 'expo-linear-gradient';
import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { gradients, layout, spacing } from '@/shared/theme/tokens';

type AppScreenProps = PropsWithChildren<{
  contentContainerStyle?: StyleProp<ViewStyle>;
  scroll?: boolean;
}>;

export function AppScreen({ children, contentContainerStyle, scroll = true }: AppScreenProps) {
  return (
    <LinearGradient colors={gradients.screen} style={styles.background}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            contentInsetAdjustmentBehavior="automatic"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={[styles.content, contentContainerStyle]}>{children}</View>
          </ScrollView>
        ) : (
          <View style={styles.staticOuter}>
            <View style={[styles.content, styles.staticContent, contentContainerStyle]}>{children}</View>
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    flexGrow: 1,
  },
  content: {
    boxSizing: 'border-box',
    flexGrow: 1,
    gap: spacing.xl,
    maxWidth: layout.contentMaxWidth,
    minWidth: 0,
    paddingBottom: spacing.xxl,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.md,
    width: '100%',
  },
  staticOuter: {
    alignItems: 'center',
    flex: 1,
  },
  staticContent: {
    flex: 1,
  },
});
