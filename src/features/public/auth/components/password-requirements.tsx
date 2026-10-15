import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import type { PasswordRequirementState } from '@/features/public/auth/models/password-requirements';
import { AppText } from '@/shared/components/app-text';
import { palette, spacing } from '@/shared/theme/tokens';

type PasswordRequirementsProps = {
  requirements: readonly PasswordRequirementState[];
};

function PasswordRequirementItem({ isMet, label }: PasswordRequirementState) {
  const [progress] = useState(() => new Animated.Value(isMet ? 1 : 0));

  useEffect(() => {
    const animation = Animated.spring(progress, {
      bounciness: 8,
      speed: 18,
      toValue: isMet ? 1 : 0,
      useNativeDriver: true,
    });

    animation.start();
    return () => animation.stop();
  }, [isMet, progress]);

  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${isMet ? 'cumplido' : 'pendiente'}`}
      accessibilityRole="text"
      style={styles.requirementRow}>
      <Animated.View
        style={[
          styles.circle,
          isMet && styles.circleMet,
          {
            opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }),
            transform: [
              {
                scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] }),
              },
            ],
          },
        ]}>
        <Animated.View style={{ opacity: progress }}>
          <Ionicons color={palette.white} name="checkmark" size={11} />
        </Animated.View>
      </Animated.View>
      <AppText style={isMet && styles.labelMet} tone="muted" variant="caption">
        {label}
      </AppText>
    </View>
  );
}

export function PasswordRequirements({ requirements }: PasswordRequirementsProps) {
  return (
    <View style={styles.requirementsContainer}>
      {requirements.map((requirement) => (
        <PasswordRequirementItem key={requirement.id} {...requirement} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  requirementsContainer: {
    gap: spacing.xs,
    marginTop: -spacing.sm,
  },
  requirementRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  circle: {
    alignItems: 'center',
    borderColor: palette.textSubtle,
    borderRadius: 8,
    borderWidth: 1.5,
    height: 16,
    justifyContent: 'center',
    width: 16,
  },
  circleMet: {
    backgroundColor: palette.secondary,
    borderColor: palette.secondary,
  },
  labelMet: {
    color: palette.secondary,
  },
});
