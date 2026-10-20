import { AppScreen } from '@/shared/components/app-screen';
import { AppText } from '@/shared/components/app-text';
import { palette } from '@/shared/theme/tokens';
import { Redirect } from 'expo-router';
import type { PropsWithChildren } from 'react';
import { ActivityIndicator } from 'react-native';
import { useStylist } from '../view-models/stylist-provider';
import { StylistButton, StylistCard } from './stylist-ui';

export function StylistSessionGate({ children }: PropsWithChildren) {
  const { checkingSession, hasSession, hasData, error, refresh, signOut } = useStylist();
  if (checkingSession) return <AppScreen><ActivityIndicator color={palette.secondary} /><AppText>Comprobando sesión…</AppText></AppScreen>;
  if (!hasSession) return <Redirect href="/public/login" />;
  if (!hasData) return <AppScreen><StylistCard>
    {error ? <><AppText variant="subtitle">No se pudo cargar tu información</AppText><AppText tone="error">{error}</AppText>
      <StylistButton label="Reintentar" onPress={() => { void refresh(); }} />
      <StylistButton label="Volver a iniciar sesión" variant="outline" onPress={() => { void signOut(); }} /></>
      : <><ActivityIndicator color={palette.secondary} /><AppText>Cargando tus citas y horario…</AppText></>}
  </StylistCard></AppScreen>;
  return children;
}
