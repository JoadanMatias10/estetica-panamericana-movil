import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps, ReactNode } from 'react';
import { useState } from 'react';
import type { TextInputProps } from 'react-native';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/shared/components/app-text';
import { gradients, layout, palette, radius, spacing } from '@/shared/theme/tokens';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type AuthTextFieldProps = Omit<TextInputProps, 'onChange' | 'onChangeText' | 'value'> & {
  error?: string;
  icon: IoniconName;
  label: string;
  onChangeText: (value: string) => void;
  secure?: boolean;
  value: string;
};

export function AuthTextField({
  error,
  icon,
  label,
  onChangeText,
  secure = false,
  value,
  ...inputProps
}: AuthTextFieldProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const hideText = secure && !isPasswordVisible;

  return (
    <View style={styles.fieldGroup}>
      <AppText variant="label">{label}</AppText>
      <View style={[styles.inputContainer, error && styles.inputContainerError]}>
        <Ionicons color={error ? palette.error : palette.textMuted} name={icon} size={20} />
        <TextInput
          {...inputProps}
          accessibilityLabel={label}
          accessibilityHint={error || inputProps.accessibilityHint}
          autoCapitalize={inputProps.autoCapitalize ?? 'none'}
          onChangeText={onChangeText}
          placeholderTextColor={palette.textSubtle}
          secureTextEntry={hideText}
          selectionColor={palette.secondary}
          style={styles.input}
          value={value}
        />
        {secure ? (
          <Pressable
            accessibilityLabel={isPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setIsPasswordVisible((current) => !current)}
            style={({ pressed }) => pressed && styles.pressed}>
            <Ionicons
              color={palette.textMuted}
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={21}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <AppText accessibilityLiveRegion="polite" tone="error" variant="caption">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

type AuthSubmitButtonProps = {
  disabled?: boolean;
  isLoading?: boolean;
  label: string;
  loadingLabel?: string;
  onPress: () => void;
};

export function AuthSubmitButton({
  disabled = false,
  isLoading = false,
  label,
  loadingLabel = 'Procesando...',
  onPress,
}: AuthSubmitButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ busy: isLoading, disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.submitButton,
        isDisabled && styles.disabled,
        pressed && styles.pressed,
      ]}>
      <LinearGradient colors={gradients.brand} end={{ x: 1, y: 0 }} start={{ x: 0, y: 0 }} style={styles.submitFill}>
        {isLoading ? <ActivityIndicator color={palette.white} size="small" /> : null}
        <AppText tone="inverse" variant="label">
          {isLoading ? loadingLabel : label}
        </AppText>
      </LinearGradient>
    </Pressable>
  );
}

export function AuthMessage({ children, tone }: { children: ReactNode; tone: 'error' | 'success' }) {
  const isError = tone === 'error';
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.message, isError ? styles.errorMessage : styles.successMessage]}>
      <Ionicons
        color={isError ? palette.error : '#047857'}
        name={isError ? 'alert-circle-outline' : 'checkmark-circle-outline'}
        size={20}
      />
      <AppText style={[styles.messageText, !isError && styles.successText]} tone={isError ? 'error' : 'default'}>
        {children}
      </AppText>
    </View>
  );
}

export function AuthTextLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="link" hitSlop={6} onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <AppText style={styles.linkText} variant="label">
        {label}
      </AppText>
    </Pressable>
  );
}

export function AuthDivider() {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.dividerLine} />
      <AppText tone="muted" variant="caption">o continúa con</AppText>
      <View style={styles.dividerLine} />
    </View>
  );
}

type GoogleAuthButtonProps = {
  disabled?: boolean;
  isLoading?: boolean;
  onPress: () => void;
};

export function GoogleAuthButton({
  disabled = false,
  isLoading = false,
  onPress,
}: GoogleAuthButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <Pressable
      accessibilityLabel="Continuar con Google"
      accessibilityRole="button"
      accessibilityState={{ busy: isLoading, disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.googleButton,
        isDisabled && styles.disabled,
        pressed && styles.pressed,
      ]}>
      {isLoading ? (
        <ActivityIndicator color="#1F1F1F" size="small" />
      ) : (
        <Image
          accessible={false}
          contentFit="contain"
          source={require('@/assets/images/google-g-logo.png')}
          style={styles.googleIcon}
        />
      )}
      <AppText style={styles.googleButtonText} variant="label">
        {isLoading ? 'Conectando con Google...' : 'Continuar con Google'}
      </AppText>
    </Pressable>
  );
}

type PrivacyAcceptanceProps = {
  checked: boolean;
  error?: string;
  onOpenNotice: () => void;
  onToggle: () => void;
};

export function PrivacyAcceptance({
  checked,
  error,
  onOpenNotice,
  onToggle,
}: PrivacyAcceptanceProps) {
  return (
    <View style={styles.privacyGroup}>
      <View style={styles.privacyRow}>
        <Pressable
          accessibilityLabel="Aceptar aviso de privacidad"
          accessibilityRole="checkbox"
          accessibilityState={{ checked }}
          hitSlop={6}
          onPress={onToggle}
          style={({ pressed }) => [styles.checkbox, checked && styles.checkboxChecked, pressed && styles.pressed]}>
          {checked ? <Ionicons color={palette.white} name="checkmark" size={17} /> : null}
        </Pressable>
        <View style={styles.privacyCopy}>
          <AppText variant="caption">He leído y acepto el </AppText>
          <AuthTextLink label="aviso de privacidad" onPress={onOpenNotice} />
        </View>
      </View>
      {error ? <AppText tone="error" variant="caption">{error}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldGroup: {
    gap: spacing.sm,
  },
  inputContainer: {
    alignItems: 'center',
    backgroundColor: palette.surfaceMuted,
    borderColor: palette.border,
    borderRadius: radius.md,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  inputContainerError: {
    backgroundColor: '#FFF5F5',
    borderColor: palette.error,
  },
  input: {
    color: palette.text,
    flex: 1,
    fontSize: 15,
    minHeight: 50,
    minWidth: 0,
    paddingVertical: spacing.md,
  },
  submitButton: {
    borderRadius: radius.pill,
    minHeight: 50,
    overflow: 'hidden',
  },
  submitFill: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.72,
  },
  message: {
    alignItems: 'flex-start',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  errorMessage: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FEB2B2',
  },
  successMessage: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  messageText: {
    flex: 1,
  },
  successText: {
    color: '#047857',
  },
  linkText: {
    color: palette.secondary,
    textAlign: 'center',
  },
  dividerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  dividerLine: {
    backgroundColor: palette.border,
    flex: 1,
    height: 1,
  },
  googleButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#747775',
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: layout.minimumTouchTarget,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  googleButtonText: {
    color: '#1F1F1F',
  },
  googleIcon: {
    height: 20,
    width: 20,
  },
  privacyGroup: {
    gap: spacing.sm,
  },
  privacyRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  checkbox: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  checkboxChecked: {
    backgroundColor: palette.secondary,
    borderColor: palette.secondary,
  },
  privacyCopy: {
    alignItems: 'baseline',
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
