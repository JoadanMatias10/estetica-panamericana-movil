import { type Href, useRouter } from 'expo-router';
import { useCallback } from 'react';

import {
  moduleDefinitions,
  type ModuleDestination,
  type ModuleId,
} from '@/features/navigation/models/module-navigation';

export function useModuleNavigationViewModel(moduleId: ModuleId) {
  const router = useRouter();
  const definition = moduleDefinitions[moduleId];

  const openHref = useCallback(
    (href: string) => {
      router.push(href as Href);
    },
    [router],
  );

  const openDestination = useCallback(
    (destination: ModuleDestination) => {
      openHref(destination.href);
    },
    [openHref],
  );

  const goHome = useCallback(() => {
    router.replace(definition.homeHref as Href);
  }, [definition.homeHref, router]);

  return {
    definition,
    goHome,
    openDestination,
    openHref,
  };
}
