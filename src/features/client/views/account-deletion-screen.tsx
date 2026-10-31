import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAccountDeletionViewModel } from '@/features/client/view-models/use-account-deletion-view-model';
import { AuthMessage, AuthSubmitButton, AuthTextField, AuthTextLink } from '@/features/public/auth/components/auth-form-controls';
import { AuthScreenLayout } from '@/features/public/auth/components/auth-screen-layout';
import { AppText } from '@/shared/components/app-text';
import { layout, palette, radius, spacing } from '@/shared/theme/tokens';

type Props = { onBack: () => void; onHome: () => void };

export function AccountDeletionScreen({ onBack, onHome }: Props) {
  const vm = useAccountDeletionViewModel();
  return (
    <AuthScreenLayout
      icon="trash-outline"
      onBack={vm.result ? onHome : onBack}
      subtitle="Tú decides sobre tu cuenta y tus datos de Estética Panamericana."
      title={vm.result ? 'Eliminación confirmada' : 'Eliminar mi cuenta'}>
      {vm.result ? (
        <>
          <AuthMessage tone="success">{vm.result}</AuthMessage>
          <AuthSubmitButton label="Ir al inicio" onPress={onHome} />
        </>
      ) : (
        <>
          <View style={styles.details}>
            <AppText variant="subtitle">Antes de continuar</AppText>
            <AppText>Se eliminarán tu perfil, datos de contacto, preferencias, citas, notificaciones y comprobantes asociados. Tus próximas citas también se cancelarán.</AppText>
            <AppText>Los totales de ventas se conservarán sin tu nombre ni vínculo con la cuenta. Tu cuenta personal de Google seguirá existiendo.</AppText>
            <AppText tone="error">La eliminación es permanente. Si cambias de opinión, cancela antes de confirmarla.</AppText>
          </View>
          <AuthTextField
            autoComplete="email"
            editable={!vm.isBusy}
            icon="mail-outline"
            keyboardType="email-address"
            label="Correo de la cuenta"
            maxLength={254}
            onChangeText={vm.updateEmail}
            value={vm.email}
          />
          {vm.notice ? <AuthMessage tone="success">{vm.notice}</AuthMessage> : null}
          {vm.hasCode ? (
            <>
              <AuthTextField
                autoComplete="one-time-code"
                editable={!vm.isBusy}
                icon="key-outline"
                keyboardType="number-pad"
                label="Código de eliminación"
                maxLength={8}
                onChangeText={vm.updateCode}
                placeholder="8 dígitos"
                textContentType="oneTimeCode"
                value={vm.code}
              />
              <Pressable
                accessibilityLabel="Confirmo que quiero eliminar permanentemente mi cuenta y mis datos"
                accessibilityRole="checkbox"
                accessibilityState={{ checked: vm.acknowledged, disabled: vm.isBusy }}
                disabled={vm.isBusy}
                onPress={vm.toggleAcknowledged}
                style={styles.confirmation}>
                <Ionicons color={palette.primary} name={vm.acknowledged ? 'checkbox' : 'square-outline'} size={26} />
                <AppText style={styles.flex}>Entiendo que esta acción es permanente y quiero eliminar mi cuenta y mis datos.</AppText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ busy: vm.isBusy, disabled: vm.isBusy || vm.code.length !== 8 || !vm.acknowledged }}
                disabled={vm.isBusy || vm.code.length !== 8 || !vm.acknowledged}
                onPress={() => { void vm.confirm(); }}
                style={({ pressed }) => [styles.deleteButton, (vm.isBusy || vm.code.length !== 8 || !vm.acknowledged) && styles.disabled, pressed && styles.disabled]}>
                <AppText style={styles.deleteLabel} variant="label">{vm.isBusy ? 'Procesando…' : 'Eliminar mi cuenta permanentemente'}</AppText>
              </Pressable>
              <AuthSubmitButton disabled={vm.isBusy} label="Solicitar otro código" onPress={() => { void vm.requestCode(); }} />
              <AppText tone="muted" variant="caption">Puedes pedir otro código después de un minuto. Solo será válido el más reciente.</AppText>
            </>
          ) : <AuthSubmitButton isLoading={vm.isBusy} label="Enviar código de confirmación" onPress={() => { void vm.requestCode(); }} />}
          {vm.error ? <AuthMessage tone="error">{vm.error}</AuthMessage> : null}
          {!vm.isBusy ? <AuthTextLink label="Cancelar y volver" onPress={onBack} /> : null}
        </>
      )}
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  details: { gap: spacing.md },
  confirmation: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, minHeight: layout.minimumTouchTarget },
  flex: { flex: 1 },
  deleteButton: { alignItems: 'center', backgroundColor: palette.error, borderRadius: radius.pill, justifyContent: 'center', minHeight: layout.minimumTouchTarget, padding: spacing.lg },
  deleteLabel: { color: palette.white, textAlign: 'center' },
  disabled: { opacity: 0.5 },
});
