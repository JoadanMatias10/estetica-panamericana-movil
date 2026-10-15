import { Redirect, usePathname } from 'expo-router';
import type { PropsWithChildren } from 'react';

import {
  ClientLoadingState,
  ClientResourceMessage,
} from '@/features/client/components/client-resource-state';
import { useClientSessionViewModel } from '@/features/client/view-models/use-client-session-view-model';
import { AppScreen } from '@/shared/components/app-screen';

export function ClientSessionGate({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const { checkSession, error, isChecking, user } = useClientSessionViewModel();

  if (isChecking) {
    return (
      <AppScreen scroll={false}>
        <ClientLoadingState label="Comprobando tu sesión..." />
      </AppScreen>
    );
  }

  if (error) {
    return (
      <AppScreen scroll={false}>
        <ClientResourceMessage
          actionLabel="Reintentar"
          message={error}
          onAction={() => { void checkSession(); }}
          title="No se pudo comprobar tu sesión"
          tone="error"
        />
      </AppScreen>
    );
  }

  if (!user) return <Redirect href="/public/login" />;
  const isCompletingProfile = pathname === '/client/complete-profile';
  if (!user.profileComplete && !isCompletingProfile) {
    return <Redirect href="/client/complete-profile" />;
  }
  if (user.profileComplete && isCompletingProfile) {
    return <Redirect href="/client" />;
  }
  return children;
}
