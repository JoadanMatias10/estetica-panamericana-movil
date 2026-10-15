import { StyleSheet, View } from 'react-native';

import {
  AuthDivider,
  AuthMessage,
  AuthSubmitButton,
  AuthTextField,
  AuthTextLink,
  GoogleAuthButton,
} from '@/features/public/auth/components/auth-form-controls';
import { AuthScreenLayout } from '@/features/public/auth/components/auth-screen-layout';
import { useLoginViewModel } from '@/features/public/auth/view-models/use-login-view-model';
import { AppText } from '@/shared/components/app-text';
import { spacing } from '@/shared/theme/tokens';

export function LoginScreen() {
  const viewModel = useLoginViewModel();

  return (
    <AuthScreenLayout
      footer={(
        <View style={styles.footerRow}>
          <AppText tone="muted">¿Aún no tienes cuenta?</AppText>
          <AuthTextLink label="Crear cuenta" onPress={viewModel.goToRegister} />
        </View>
      )}
      icon="person-circle-outline"
      onBack={viewModel.goBack}
      subtitle="Ingresa para gestionar tus citas y compras."
      title="Iniciar sesión">
      {viewModel.requestError ? (
        <AuthMessage tone="error">{viewModel.requestError}</AuthMessage>
      ) : null}

      <AuthTextField
        autoComplete="email"
        error={viewModel.errors.correo}
        icon="mail-outline"
        keyboardType="email-address"
        label="Correo electrónico"
        onChangeText={(value) => viewModel.updateField('correo', value)}
        placeholder="nombre@correo.com"
        returnKeyType="next"
        textContentType="emailAddress"
        value={viewModel.form.correo}
      />

      <AuthTextField
        autoComplete="current-password"
        error={viewModel.errors.password}
        icon="lock-closed-outline"
        label="Contraseña"
        onChangeText={(value) => viewModel.updateField('password', value)}
        onSubmitEditing={() => void viewModel.submit()}
        placeholder="Ingresa tu contraseña"
        returnKeyType="done"
        secure
        textContentType="password"
        value={viewModel.form.password}
      />

      <View style={styles.forgotLink}>
        <AuthTextLink label="¿Olvidaste tu contraseña?" onPress={viewModel.goToRecoverPassword} />
      </View>

      <AuthSubmitButton
        disabled={viewModel.isGoogleSubmitting}
        isLoading={viewModel.isSubmitting}
        label="Iniciar sesión"
        loadingLabel="Ingresando..."
        onPress={() => void viewModel.submit()}
      />

      <AuthDivider />
      <GoogleAuthButton
        disabled={viewModel.isSubmitting}
        isLoading={viewModel.isGoogleSubmitting}
        onPress={() => void viewModel.signInWithGoogle()}
      />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  forgotLink: {
    alignItems: 'flex-end',
  },
  footerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
});
