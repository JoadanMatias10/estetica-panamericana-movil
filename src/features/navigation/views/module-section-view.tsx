import { StyleSheet, View } from 'react-native';

import type { ModuleId } from '@/features/navigation/models/module-navigation';
import { useModuleNavigationViewModel } from '@/features/navigation/view-models/use-module-navigation-view-model';
import { AppButton } from '@/shared/components/app-button';
import { AppCard } from '@/shared/components/app-card';
import { AppIcon } from '@/shared/components/app-icon';
import { AppScreen } from '@/shared/components/app-screen';
import { AppText } from '@/shared/components/app-text';
import { BrandHeader } from '@/shared/components/brand-header';
import { palette, radius, spacing } from '@/shared/theme/tokens';

type ModuleSectionViewProps = {
  moduleId: ModuleId;
  sectionKey: string;
};

export function ModuleSectionView({ moduleId, sectionKey }: ModuleSectionViewProps) {
  const { definition, goHome, openHref } = useModuleNavigationViewModel(moduleId);
  const destination = definition.destinations.find((item) => item.key === sectionKey);

  if (!destination) {
    throw new Error(`Unknown ${moduleId} module section: ${sectionKey}`);
  }

  const showLocalModulePreview = moduleId === 'public' && sectionKey === 'more';

  return (
    <AppScreen>
      <BrandHeader subtitle={definition.headerSubtitle} title={destination.title} />

      <View style={styles.heading}>
        <View style={styles.iconContainer}>
          <AppIcon color={palette.primary} name={destination.icon} size={34} />
        </View>
        <AppText style={styles.centerText} variant="title">
          {destination.title}
        </AppText>
        <AppText style={styles.centerText} tone="muted">
          {destination.description}
        </AppText>
      </View>

      <AppCard accentColor={palette.primary} style={styles.scopeCard}>
        <AppText variant="label">Estructura lista para continuar</AppText>
        <AppText tone="muted">
          Esta vista ya forma parte de la navegación base y utiliza los componentes visuales comunes.
          Su información y acciones reales se implementarán en la actividad funcional correspondiente.
        </AppText>
      </AppCard>

      {showLocalModulePreview ? (
        <AppCard style={styles.previewCard}>
          <AppText variant="subtitle">Vista local de módulos</AppText>
          <AppText tone="muted">
            Accesos temporales para validar la navegación de Cliente y Estilista antes de implementar la
            sesión por roles en APP-006.
          </AppText>
          <AppButton fullWidth label="Abrir módulo Cliente" onPress={() => openHref('/client')} />
          <AppButton
            fullWidth
            label="Abrir módulo Estilista"
            onPress={() => openHref('/stylist')}
            variant="secondary"
          />
        </AppCard>
      ) : null}

      <AppButton fullWidth label="Volver al inicio" onPress={goHome} variant="secondary" />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  heading: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  iconContainer: {
    alignItems: 'center',
    backgroundColor: '#FDEAF4',
    borderRadius: radius.pill,
    height: 68,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    width: 68,
  },
  centerText: {
    textAlign: 'center',
  },
  scopeCard: {
    gap: spacing.sm,
  },
  previewCard: {
    gap: spacing.md,
  },
});
