/// <reference types="jest" />
import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { StylistSessionGate } from '../src/features/stylist/components/stylist-session-gate';
import { useStylist } from '../src/features/stylist/view-models/stylist-provider';

jest.mock('../src/features/stylist/view-models/stylist-provider', () => ({ useStylist: jest.fn() }));
jest.mock('expo-router', () => ({
  Redirect: ({ href }: { href: string }) => {
    const { Text } = require('react-native');
    return <Text>{href}</Text>;
  },
}));
jest.mock('../src/shared/components/app-screen', () => ({
  AppScreen: ({ children }: { children: React.ReactNode }) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
}));
jest.mock('../src/features/stylist/components/stylist-ui', () => ({
  StylistCard: ({ children }: { children: React.ReactNode }) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
  StylistButton: ({ label, onPress }: { label: string; onPress: () => void }) => {
    const { Pressable, Text } = require('react-native');
    return <Pressable onPress={onPress}><Text>{label}</Text></Pressable>;
  },
}));

const state = {
  checkingSession: false, hasSession: true, hasData: true, error: '',
  refresh: jest.fn(), signOut: jest.fn(),
} as unknown as ReturnType<typeof useStylist>;

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useStylist).mockReturnValue(state);
});

describe('acceso al módulo de estilista', () => {
  it('espera mientras se verifica la sesión', () => {
    jest.mocked(useStylist).mockReturnValue({ ...state, checkingSession: true });
    expect(render(<StylistSessionGate><Text>Agenda privada</Text></StylistSessionGate>).getByText('Comprobando sesión…')).toBeTruthy();
  });

  it('redirige al login si no hay una sesión activa', () => {
    jest.mocked(useStylist).mockReturnValue({ ...state, hasSession: false });
    const screen = render(<StylistSessionGate><Text>Agenda privada</Text></StylistSessionGate>);
    expect(screen.getByText('/public/login')).toBeTruthy();
    expect(screen.queryByText('Agenda privada')).toBeNull();
  });

  it('permite reintentar o cerrar sesión si falló la carga', () => {
    jest.mocked(useStylist).mockReturnValue({ ...state, hasData: false, error: 'Sin red' });
    const screen = render(<StylistSessionGate><Text>Agenda privada</Text></StylistSessionGate>);
    fireEvent.press(screen.getByText('Reintentar'));
    fireEvent.press(screen.getByText('Volver a iniciar sesión'));
    expect(state.refresh).toHaveBeenCalledTimes(1);
    expect(state.signOut).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Agenda privada')).toBeNull();
  });

  it('muestra el contenido tras cargar los datos', () => {
    expect(render(<StylistSessionGate><Text>Agenda privada</Text></StylistSessionGate>).getByText('Agenda privada')).toBeTruthy();
  });
});
