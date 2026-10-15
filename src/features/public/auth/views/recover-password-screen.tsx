import { StyleSheet, View } from 'react-native';

import {
  AuthMessage,
  AuthSubmitButton,
  AuthTextField,
  AuthTextLink,
} from '@/features/public/auth/components/auth-form-controls';
import { AuthScreenLayout } from '@/features/public/auth/components/auth-screen-layout';
import { useRecoverPasswordViewModel } from '@/features/public/auth/view-models/use-recover-password-view-model';
import { AppText } from '@/shared/components/app-text';
import { spacing } from '@/shared/theme/tokens';

export function RecoverPasswordScreen() {
  const viewModel = useRecoverPasswordViewModel();

  return (
    <AuthScreenLayout
      footer={(
        <View style={styles.footerRow}>
          <AppText tone="muted">¿Recordaste tu contraseña?</AppText>
          <AuthTextLink label="Volver a iniciar sesión" onPress={viewModel.goToLogin} />
        </View>
      )}
      icon="mail-unread-outline"
      onBack={viewModel.goBack}
      subtitle="Escribe tu correo y te enviaremos un enlace para recuperar el acceso."
      title="Recuperar contraseña">
      {viewModel.requestError ? (
        <AuthMessage tone="error">{viewModel.requestError}</AuthMessage>
      ) : null}
      {viewModel.successMessage ? (
        <AuthMessage tone="success">{viewModel.successMessage}</AuthMessage>
      ) : null}

      <AuthTextField
        autoComplete="email"
        error={viewModel.errors.correo}
        icon="mail-outline"
        keyboardType="email-address"
        label="Correo electrónico"
        onChangeText={viewModel.updateEmail}
        onSubmitEditing={() => void viewModel.submit()}
        placeholder="nombre@correo.com"
        returnKeyType="send"
        textContentType="emailAddress"
        value={viewModel.form.correo}
      />

      <AuthSubmitButton
        isLoading={viewModel.isSubmitting}
        label="Enviar enlace"
        loadingLabel="Enviando..."
        onPress={() => void viewModel.submit()}
      />

      <View style={styles.helpBox}>
        <AppText variant="label">¿Qué pasará después?</AppText>
        <AppText tone="muted" variant="caption">
          Recibirás un correo con un enlace temporal. Por seguridad, el servidor valida que el enlace
          exista, no haya sido utilizado y todavía esté vigente.
        </AppText>
      </View>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  footerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  helpBox: {
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    gap: spacing.xs,
    padding: spacing.md,
  },
});
