import { StyleSheet, View } from 'react-native';

import { useModuleNavigationViewModel } from '@/features/navigation/view-models/use-module-navigation-view-model';
import { AppButton } from '@/shared/components/app-button';
import { AppCard } from '@/shared/components/app-card';
import { AppIcon } from '@/shared/components/app-icon';
import { AppScreen } from '@/shared/components/app-screen';
import { AppText } from '@/shared/components/app-text';
import { BrandHeader } from '@/shared/components/brand-header';
import { palette, radius, spacing } from '@/shared/theme/tokens';

export function LoginBaseView() {
  const { goHome } = useModuleNavigationViewModel('public');

  return (
    <AppScreen>
      <BrandHeader subtitle="Acceso a tu cuenta" />

      <View style={styles.heading}>
        <View style={styles.iconContainer}>
          <AppIcon color={palette.primary} name="login" size={36} />
        </View>
        <AppText style={styles.centerText} variant="display">
          Iniciar sesión
        </AppText>
        <AppText style={styles.centerText} tone="muted">
          La ruta de acceso ya está conectada a la navegación pública.
        </AppText>
      </View>

      <AppCard accentColor={palette.secondary} style={styles.card}>
        <AppText variant="label">Programado para APP-006</AppText>
        <AppText tone="muted">
          El formulario, sus validaciones, Google y la sesión segura se añadirán con autenticación. En
          esta etapa no se solicitan ni almacenan credenciales.
        </AppText>
      </AppCard>

      <AppButton fullWidth label="Volver al inicio público" onPress={goHome} variant="secondary" />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  heading: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
  },
  iconContainer: {
    alignItems: 'center',
    backgroundColor: '#FDEAF4',
    borderRadius: radius.pill,
    height: 76,
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: 76,
  },
  centerText: {
    textAlign: 'center',
  },
  card: {
    gap: spacing.sm,
  },
});
