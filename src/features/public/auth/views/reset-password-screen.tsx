import { ActivityIndicator, StyleSheet, View } from 'react-native';

import {
  AuthMessage,
  AuthSubmitButton,
  AuthTextField,
  AuthTextLink,
} from '@/features/public/auth/components/auth-form-controls';
import { AuthScreenLayout } from '@/features/public/auth/components/auth-screen-layout';
import { PASSWORD_REQUIREMENTS } from '@/features/public/auth/models/public-auth-validation';
import { useResetPasswordViewModel } from '@/features/public/auth/view-models/use-reset-password-view-model';
import { AppText } from '@/shared/components/app-text';
import { palette, spacing } from '@/shared/theme/tokens';

type ResetPasswordScreenProps = {
  token: string;
};

export function ResetPasswordScreen({ token }: ResetPasswordScreenProps) {
  const viewModel = useResetPasswordViewModel(token);

  return (
    <AuthScreenLayout
      footer={<AuthTextLink label="Volver a iniciar sesión" onPress={viewModel.goToLogin} />}
      icon="key-outline"
      onBack={viewModel.goBack}
      subtitle="Verifica el enlace y define una nueva contraseña segura."
      title="Nueva contraseña">
      {viewModel.tokenState === 'loading' ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={palette.secondary} size="large" />
          <AppText tone="muted">Validando tu enlace de recuperación...</AppText>
        </View>
      ) : null}

      {viewModel.tokenState === 'invalid' ? (
        <View style={styles.stateGroup}>
          <AuthMessage tone="error">
            {viewModel.requestError || 'El enlace de recuperación no es válido o ya expiró.'}
          </AuthMessage>
          {token ? (
            <AuthSubmitButton
              label="Validar nuevamente"
              onPress={() => void viewModel.retryTokenValidation()}
            />
          ) : null}
          <AuthTextLink label="Solicitar un enlace nuevo" onPress={viewModel.goToRecoverPassword} />
        </View>
      ) : null}

      {viewModel.tokenState === 'valid' && viewModel.successMessage ? (
        <View style={styles.stateGroup}>
          <AuthMessage tone="success">{viewModel.successMessage}</AuthMessage>
          <AuthSubmitButton label="Ir a iniciar sesión" onPress={viewModel.goToLogin} />
        </View>
      ) : null}

      {viewModel.tokenState === 'valid' && !viewModel.successMessage ? (
        <>
          {viewModel.tokenUser ? (
            <View style={styles.accountPreview}>
              <AppText variant="label">{viewModel.tokenUser.nombre || 'Cuenta encontrada'}</AppText>
              <AppText tone="muted" variant="caption">{viewModel.tokenUser.correo}</AppText>
            </View>
          ) : null}

          {viewModel.requestError ? (
            <AuthMessage tone="error">{viewModel.requestError}</AuthMessage>
          ) : null}

          <AuthTextField
            autoComplete="new-password"
            error={viewModel.errors.password}
            icon="lock-closed-outline"
            label="Nueva contraseña"
            onChangeText={(value) => viewModel.updateField('password', value)}
            placeholder="Crea una contraseña segura"
            secure
            textContentType="newPassword"
            value={viewModel.form.password}
          />
          <AppText style={styles.passwordHint} tone="muted" variant="caption">
            {PASSWORD_REQUIREMENTS}
          </AppText>

          <AuthTextField
            autoComplete="new-password"
            error={viewModel.errors.confirmarPassword}
            icon="shield-checkmark-outline"
            label="Confirmar nueva contraseña"
            onChangeText={(value) => viewModel.updateField('confirmarPassword', value)}
            onSubmitEditing={() => void viewModel.submit()}
            placeholder="Repite tu nueva contraseña"
            returnKeyType="done"
            secure
            textContentType="newPassword"
            value={viewModel.form.confirmarPassword}
          />

          <AuthSubmitButton
            isLoading={viewModel.isSubmitting}
            label="Guardar contraseña"
            loadingLabel="Actualizando..."
            onPress={() => void viewModel.submit()}
          />
        </>
      ) : null}
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  centerState: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.xxl,
  },
  stateGroup: {
    gap: spacing.lg,
  },
  accountPreview: {
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    gap: spacing.xs,
    padding: spacing.md,
  },
  passwordHint: {
    marginTop: -spacing.md,
  },
});
