/// <reference types="jest" />
import { act, render } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import DeleteAccountRoute from '../src/app/public/delete-account';
import { AccountDeletionScreen } from '../src/features/client/views/account-deletion-screen';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('../src/features/client/views/account-deletion-screen', () => ({
  AccountDeletionScreen: jest.fn(() => null),
}));

const back = jest.fn();
const replace = jest.fn();
const canGoBack = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useRouter).mockReturnValue({ back, canGoBack, replace } as unknown as ReturnType<typeof useRouter>);
});

it('regresa a la pantalla anterior cuando existe historial de navegación', () => {
  canGoBack.mockReturnValue(true);
  render(<DeleteAccountRoute />);

  const { onBack } = jest.mocked(AccountDeletionScreen).mock.calls[0][0];
  act(() => onBack());

  expect(back).toHaveBeenCalledTimes(1);
  expect(replace).not.toHaveBeenCalled();
});

it('regresa al inicio público si no existe una pantalla anterior', () => {
  canGoBack.mockReturnValue(false);
  render(<DeleteAccountRoute />);

  const { onBack, onHome } = jest.mocked(AccountDeletionScreen).mock.calls[0][0];
  act(() => onBack());
  act(() => onHome());

  expect(back).not.toHaveBeenCalled();
  expect(replace).toHaveBeenNthCalledWith(1, '/public');
  expect(replace).toHaveBeenNthCalledWith(2, '/public');
});
