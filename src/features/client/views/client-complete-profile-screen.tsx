import { View } from 'react-native';

import { ClientTextField } from '@/features/client/components/client-controls';
import { ClientPageHeader } from '@/features/client/components/client-page-header';
import {
  ClientLoadingState,
  ClientResourceMessage,
} from '@/features/client/components/client-resource-state';
import { clientScreenStyles as styles } from '@/features/client/styles/client-screens.styles';
import { useClientCompleteProfileViewModel } from '@/features/client/view-models/use-client-complete-profile-view-model';
import { AppButton } from '@/shared/components/app-button';
import { AppCard } from '@/shared/components/app-card';
import { AppScreen } from '@/shared/components/app-screen';
import { AppText } from '@/shared/components/app-text';

export function ClientCompleteProfileScreen() {
  const viewModel = useClientCompleteProfileViewModel();
  const busy = viewModel.isSaving || viewModel.isCancelling;

  return (
    <AppScreen>
      <ClientPageHeader
        showCart={false}
        showNotifications={false}
        subtitle="Necesitamos estos datos para asociar tus citas y compras."
        title="Completar perfil"
      />

      {viewModel.isLoading ? <ClientLoadingState label="Cargando tus datos..." /> : null}
      {!viewModel.isLoading && viewModel.loadError ? (
        <ClientResourceMessage
          actionLabel="Reintentar"
          message={viewModel.loadError}
          onAction={viewModel.retry}
          title="No se pudo cargar tu perfil"
          tone="error"
        />
      ) : null}

      {!viewModel.isLoading && !viewModel.loadError ? (
        <View style={styles.section}>
          <AppCard style={styles.compactCard}>
            <AppText variant="subtitle">Termina tu registro</AppText>
            <AppText tone="muted">
              Solo solicitamos los datos obligatorios para operar tu cuenta. El apellido materno es opcional.
            </AppText>
          </AppCard>

          <ClientTextField
            autoCapitalize="words"
            error={viewModel.errors.firstName}
            icon="person-outline"
            label="Nombre"
            onChangeText={(value) => viewModel.updateField('firstName', value)}
            value={viewModel.form.firstName}
          />
          <ClientTextField
            autoCapitalize="words"
            error={viewModel.errors.paternalLastName}
            label="Apellido paterno"
            onChangeText={(value) => viewModel.updateField('paternalLastName', value)}
            value={viewModel.form.paternalLastName}
          />
          <ClientTextField
            autoCapitalize="words"
            error={viewModel.errors.maternalLastName}
            label="Apellido materno (opcional)"
            onChangeText={(value) => viewModel.updateField('maternalLastName', value)}
            value={viewModel.form.maternalLastName}
          />
          <ClientTextField
            error={viewModel.errors.phone}
            icon="call-outline"
            keyboardType="phone-pad"
            label="Teléfono"
            maxLength={10}
            onChangeText={(value) => viewModel.updateField('phone', value)}
            value={viewModel.form.phone}
          />
          <ClientTextField
            autoCapitalize="none"
            editable={!viewModel.isGoogleEmail}
            error={viewModel.errors.email}
            icon="mail-outline"
            keyboardType="email-address"
            label="Correo electrónico"
            onChangeText={(value) => viewModel.updateField('email', value)}
            value={viewModel.form.email}
          />
          {viewModel.isGoogleEmail ? (
            <AppText tone="muted" variant="caption">
              Este correo fue verificado por Google y no puede editarse aquí.
            </AppText>
          ) : null}

          {viewModel.saveError ? (
            <View style={styles.errorBox}>
              <AppText tone="error">{viewModel.saveError}</AppText>
            </View>
          ) : null}

          <AppButton
            disabled={busy}
            label={viewModel.isSaving ? 'Guardando...' : 'Guardar y continuar'}
            onPress={() => { void viewModel.save(); }}
          />
          <AppButton
            disabled={busy}
            label={viewModel.isCancelling ? 'Cerrando sesión...' : 'Cancelar y cerrar sesión'}
            onPress={() => { void viewModel.cancel(); }}
            variant="ghost"
          />
        </View>
      ) : null}
    </AppScreen>
  );
}
