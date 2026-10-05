import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import type { ModuleId } from '@/features/navigation/models/module-navigation';
import { useModuleNavigationViewModel } from '@/features/navigation/view-models/use-module-navigation-view-model';
import { ActionTile } from '@/shared/components/action-tile';
import { AppButton } from '@/shared/components/app-button';
import { AppCard } from '@/shared/components/app-card';
import { AppIcon } from '@/shared/components/app-icon';
import { AppScreen } from '@/shared/components/app-screen';
import { AppText } from '@/shared/components/app-text';
import { BrandHeader } from '@/shared/components/brand-header';
import { gradients, palette, radius, spacing } from '@/shared/theme/tokens';

type ModuleOverviewViewProps = {
  moduleId: ModuleId;
};

export function ModuleOverviewView({ moduleId }: ModuleOverviewViewProps) {
  const { definition, openDestination, openHref } = useModuleNavigationViewModel(moduleId);
  const destinations = definition.destinations.filter((destination) => destination.key !== 'home');
  const firstDestination = destinations[0];

  return (
    <AppScreen>
      <BrandHeader subtitle={definition.headerSubtitle} title={definition.headerTitle} />

      <LinearGradient colors={gradients.soft} style={styles.hero}>
        <View style={styles.badge}>
          <AppText tone="primary" variant="caption">
            APP-002 · NAVEGACIÓN BASE
          </AppText>
        </View>
        <AppText variant="display">{definition.heroTitle}</AppText>
        <AppText tone="muted">{definition.heroDescription}</AppText>

        {firstDestination ? (
          <View style={styles.actions}>
            <AppButton
              label={`Ver ${firstDestination.title.toLocaleLowerCase('es-MX')}`}
              onPress={() => openDestination(firstDestination)}
              style={styles.actionButton}
            />
            {definition.loginHref ? (
              <AppButton
                icon="login"
                label="Iniciar sesión"
                onPress={() => openHref(definition.loginHref!)}
                style={styles.actionButton}
                variant="secondary"
              />
            ) : null}
          </View>
        ) : null}
      </LinearGradient>

      <View style={styles.section}>
        <View style={styles.sectionHeading}>
          <AppText variant="subtitle">Secciones del módulo</AppText>
          <AppText tone="muted" variant="caption">
            {destinations.length} accesos
          </AppText>
        </View>
        <View style={styles.destinationList}>
          {destinations.map((destination) => (
            <ActionTile
              description={destination.description}
              icon={destination.icon}
              key={destination.href}
              onPress={() => openDestination(destination)}
              title={destination.title}
            />
          ))}
        </View>
      </View>

      <AppCard accentColor={palette.secondary} style={styles.stageCard}>
        <View style={styles.stageIcon}>
          <AppIcon color={palette.secondary} name="info" size={22} />
        </View>
        <View style={styles.stageCopy}>
          <AppText variant="label">Alcance de esta entrega</AppText>
          <AppText tone="muted" variant="caption">
            La interfaz y sus rutas ya son navegables. Los datos, validaciones y acciones del servidor
            se incorporarán en los folios funcionales correspondientes.
          </AppText>
        </View>
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderColor: '#E9D5FF',
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.md,
    overflow: 'hidden',
    padding: spacing.xl,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: palette.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  actionButton: {
    flexBasis: 130,
    flexGrow: 1,
    minWidth: 130,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  destinationList: {
    gap: spacing.md,
  },
  stageCard: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
  },
  stageIcon: {
    alignItems: 'center',
    backgroundColor: '#F0EAFE',
    borderRadius: radius.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  stageCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
});
