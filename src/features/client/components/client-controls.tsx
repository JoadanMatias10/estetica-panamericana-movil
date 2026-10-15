import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import type { TextInputProps } from 'react-native';
import { Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';

import { AppText } from '@/shared/components/app-text';
import { layout, palette, radius, spacing } from '@/shared/theme/tokens';
import type { ClientStatusTone } from '@/features/client/models/client-formatters';

export type { ClientStatusTone } from '@/features/client/models/client-formatters';

export function ClientSectionHeading({ action, title }: { action?: ReactNode; title: string }) {
  return (
    <View style={styles.sectionHeading}>
      <AppText variant="subtitle">{title}</AppText>
      {action}
    </View>
  );
}

type ClientChipProps = {
  disabled?: boolean;
  label: string;
  onPress: () => void;
  selected?: boolean;
};

export function ClientChip({ disabled = false, label, onPress, selected = false }: ClientChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}>
      <AppText style={selected ? styles.chipTextSelected : styles.chipText} variant="caption">
        {label}
      </AppText>
    </Pressable>
  );
}

const statusColors: Record<ClientStatusTone, { backgroundColor: string; color: string }> = {
  success: { backgroundColor: '#DCFCE7', color: '#166534' },
  warning: { backgroundColor: '#FEF3C7', color: '#92400E' },
  error: { backgroundColor: '#FEE2E2', color: '#B91C1C' },
  neutral: { backgroundColor: '#F1F5F9', color: '#475569' },
  info: { backgroundColor: '#EDE9FE', color: '#5B21B6' },
};

export function ClientStatusBadge({ label, tone = 'neutral' }: { label: string; tone?: ClientStatusTone }) {
  const colors = statusColors[tone];
  return (
    <View style={[styles.statusBadge, { backgroundColor: colors.backgroundColor }]}>
      <AppText style={{ color: colors.color }} variant="caption">
        {label}
      </AppText>
    </View>
  );
}

type ClientTextFieldProps = TextInputProps & {
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
};

export function ClientTextField({ error, icon, label, multiline, style, ...props }: ClientTextFieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <AppText variant="label">{label}</AppText>
      <View style={[styles.fieldContainer, multiline && styles.fieldContainerMultiline, error && styles.fieldError]}>
        {icon ? <Ionicons color={error ? palette.error : palette.textMuted} name={icon} size={20} /> : null}
        <TextInput
          {...props}
          accessibilityLabel={label}
          multiline={multiline}
          placeholderTextColor={palette.textSubtle}
          selectionColor={palette.secondary}
          style={[styles.fieldInput, multiline && styles.fieldInputMultiline, style]}
        />
      </View>
      {error ? (
        <AppText tone="error" variant="caption">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

type ClientMenuRowProps = {
  badge?: string;
  destructive?: boolean;
  description?: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  title: string;
};

export function ClientMenuRow({ badge, destructive = false, description, icon, onPress, title }: ClientMenuRowProps) {
  const color = destructive ? palette.error : palette.secondary;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]}>
      <View style={[styles.menuIcon, { backgroundColor: destructive ? '#FFF1F2' : '#F3E8FF' }]}>
        <Ionicons color={color} name={icon} size={21} />
      </View>
      <View style={styles.menuCopy}>
        <AppText style={destructive ? styles.destructiveText : undefined} variant="label">
          {title}
        </AppText>
        {description ? (
          <AppText tone="muted" variant="caption">
            {description}
          </AppText>
        ) : null}
      </View>
      {badge ? <ClientStatusBadge label={badge} tone="info" /> : null}
      <Ionicons color={palette.textMuted} name="chevron-forward" size={19} />
    </Pressable>
  );
}

type ClientPreferenceRowProps = {
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  onValueChange: (value: boolean) => void;
  title: string;
  value: boolean;
};

export function ClientPreferenceRow({ description, icon, onValueChange, title, value }: ClientPreferenceRowProps) {
  return (
    <View style={styles.preferenceRow}>
      <View style={styles.menuIcon}>
        <Ionicons color={palette.secondary} name={icon} size={21} />
      </View>
      <View style={styles.menuCopy}>
        <AppText variant="label">{title}</AppText>
        <AppText tone="muted" variant="caption">
          {description}
        </AppText>
      </View>
      <Switch
        accessibilityLabel={title}
        onValueChange={onValueChange}
        thumbColor={palette.white}
        trackColor={{ false: '#CBD5E1', true: palette.secondaryBright }}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  chip: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipSelected: {
    backgroundColor: palette.secondary,
    borderColor: palette.secondary,
  },
  chipText: {
    color: palette.textMuted,
  },
  chipTextSelected: {
    color: palette.white,
    fontWeight: '700',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  fieldContainer: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: radius.md,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  fieldContainerMultiline: {
    alignItems: 'flex-start',
    minHeight: 108,
    paddingTop: spacing.md,
  },
  fieldError: {
    borderColor: palette.error,
  },
  fieldInput: {
    color: palette.text,
    flex: 1,
    fontSize: 15,
    minHeight: 50,
    minWidth: 0,
    paddingVertical: spacing.md,
  },
  fieldInputMultiline: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  menuRow: {
    alignItems: 'center',
    borderBottomColor: palette.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: layout.minimumTouchTarget + 16,
    paddingVertical: spacing.md,
  },
  preferenceRow: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  menuIcon: {
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    borderRadius: radius.md,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  menuCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  destructiveText: {
    color: palette.error,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.72,
  },
});
