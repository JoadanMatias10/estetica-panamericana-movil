import { StyleSheet, View } from 'react-native';

import {
  AuthMessage,
  AuthSubmitButton,
  AuthTextField,
  AuthTextLink,
  PrivacyAcceptance,
} from '@/features/public/auth/components/auth-form-controls';
import { AuthScreenLayout } from '@/features/public/auth/components/auth-screen-layout';
import { PasswordRequirements } from '@/features/public/auth/components/password-requirements';
import { useRegisterViewModel } from '@/features/public/auth/view-models/use-register-view-model';
import { AppText } from '@/shared/components/app-text';
import { spacing } from '@/shared/theme/tokens';

export function RegisterScreen() {
  const viewModel = useRegisterViewModel();

  return (
    <AuthScreenLayout
      footer={(
        <View style={styles.footerRow}>
          <AppText tone="muted">¿Ya tienes cuenta?</AppText>
          <AuthTextLink label="Iniciar sesión" onPress={viewModel.goToLogin} />
        </View>
      )}
      icon="person-add-outline"
      onBack={viewModel.goBack}
      subtitle="Crea tu cuenta para reservar servicios y consultar tus compras."
      title="Crear cuenta">
      {viewModel.requestError ? (
        <AuthMessage tone="error">{viewModel.requestError}</AuthMessage>
      ) : null}

      <AuthTextField
        autoCapitalize="words"
        autoComplete="name"
        error={viewModel.errors.nombre}
        icon="person-outline"
        label="Nombre"
        onChangeText={(value) => viewModel.updateTextField('nombre', value)}
        placeholder="Tu nombre"
        textContentType="givenName"
        value={viewModel.form.nombre}
      />

      <View style={styles.twoColumns}>
        <View style={styles.column}>
          <AuthTextField
            autoCapitalize="words"
            autoComplete="family-name"
            error={viewModel.errors.apellidoPaterno}
            icon="person-outline"
            label="Apellido paterno"
            onChangeText={(value) => viewModel.updateTextField('apellidoPaterno', value)}
            placeholder="Apellido paterno"
            textContentType="familyName"
            value={viewModel.form.apellidoPaterno}
          />
        </View>
        <View style={styles.column}>
          <AuthTextField
            autoCapitalize="words"
            autoComplete="family-name"
            error={viewModel.errors.apellidoMaterno}
            icon="person-outline"
            label="Apellido materno"
            onChangeText={(value) => viewModel.updateTextField('apellidoMaterno', value)}
            placeholder="Apellido materno"
            textContentType="familyName"
            value={viewModel.form.apellidoMaterno}
          />
        </View>
      </View>

      <AuthTextField
        autoComplete="tel"
        error={viewModel.errors.telefono}
        icon="call-outline"
        keyboardType="phone-pad"
        label="Teléfono"
        maxLength={10}
        onChangeText={(value) => viewModel.updateTextField('telefono', value)}
        placeholder="10 dígitos"
        textContentType="telephoneNumber"
        value={viewModel.form.telefono}
      />

      <AuthTextField
        autoComplete="email"
        error={viewModel.errors.correo}
        icon="mail-outline"
        keyboardType="email-address"
        label="Correo electrónico"
        onChangeText={(value) => viewModel.updateTextField('correo', value)}
        placeholder="nombre@correo.com"
        textContentType="emailAddress"
        value={viewModel.form.correo}
      />

      <AuthTextField
        autoComplete="new-password"
        error={viewModel.errors.password}
        icon="lock-closed-outline"
        label="Contraseña"
        onChangeText={(value) => viewModel.updateTextField('password', value)}
        placeholder="Crea una contraseña segura"
        secure
        textContentType="newPassword"
        value={viewModel.form.password}
      />
      <PasswordRequirements requirements={viewModel.passwordRequirements} />

      <AuthTextField
        autoComplete="new-password"
        error={viewModel.errors.confirmarPassword}
        icon="shield-checkmark-outline"
        label="Confirmar contraseña"
        onChangeText={(value) => viewModel.updateTextField('confirmarPassword', value)}
        onSubmitEditing={() => void viewModel.submit()}
        placeholder="Repite tu contraseña"
        returnKeyType="done"
        secure
        textContentType="newPassword"
        value={viewModel.form.confirmarPassword}
      />

      <PrivacyAcceptance
        checked={viewModel.form.aceptaPrivacidad}
        error={viewModel.errors.aceptaPrivacidad}
        onOpenNotice={viewModel.openPrivacyNotice}
        onToggle={viewModel.togglePrivacyAcceptance}
      />

      <AuthSubmitButton
        isLoading={viewModel.isSubmitting}
        label="Crear cuenta"
        loadingLabel="Creando cuenta..."
        onPress={() => void viewModel.submit()}
      />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  twoColumns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  column: {
    flex: 1,
    minWidth: 210,
  },
  footerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
});
