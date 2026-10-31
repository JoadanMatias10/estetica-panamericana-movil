/// <reference types="jest" />
import { fireEvent, render } from '@testing-library/react-native';
import { router, useRouter } from 'expo-router';

import ClientChangePasswordRoute from '../src/app/client/(tabs)/profile/change-password';
import { RecoverPasswordScreen } from '../src/features/public/auth/views/recover-password-screen';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
  useRouter: jest.fn(),
}));

const dismissTo = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useRouter).mockReturnValue({ dismissTo } as unknown as ReturnType<typeof useRouter>);
});

it('vuelve al perfil desde la flecha y el enlace sin ir al login', () => {
  const screen = render(<ClientChangePasswordRoute />);

  fireEvent.press(screen.getByLabelText('Volver'));
  fireEvent.press(screen.getByText('Volver a mi perfil'));

  expect(dismissTo).toHaveBeenCalledTimes(2);
  expect(dismissTo).toHaveBeenCalledWith('/client/profile');
  expect(router.replace).not.toHaveBeenCalled();
});

it('mantiene la recuperación pública con regreso al login', () => {
  const screen = render(<RecoverPasswordScreen />);

  fireEvent.press(screen.getByLabelText('Volver'));

  expect(router.replace).toHaveBeenCalledWith('/public/login');
  expect(dismissTo).not.toHaveBeenCalled();
});
