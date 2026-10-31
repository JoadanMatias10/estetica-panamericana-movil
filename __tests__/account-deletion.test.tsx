/// <reference types="jest" />
import { act, fireEvent, render, renderHook, waitFor } from '@testing-library/react-native';
import type { PublicAuthSession } from '../src/features/public/auth/models/public-auth-models';
import { accountDeletionService } from '../src/features/client/services/account-deletion-service';
import { removeClientProfilePhoto } from '../src/features/client/services/client-profile-photo-store';
import { clearClientSessionData } from '../src/features/client/services/client-session-service';
import { getPublicAuthSession } from '../src/features/public/auth/services/public-auth-session';
import { useAccountDeletionViewModel } from '../src/features/client/view-models/use-account-deletion-view-model';
import { AccountDeletionScreen } from '../src/features/client/views/account-deletion-screen';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('../src/features/client/services/account-deletion-service', () => ({ accountDeletionService: { requestCode: jest.fn(), confirm: jest.fn() } }));
jest.mock('../src/features/client/services/client-profile-photo-store', () => ({ removeClientProfilePhoto: jest.fn() }));
jest.mock('../src/features/client/services/client-session-service', () => ({ clearClientSessionData: jest.fn() }));
jest.mock('../src/features/public/auth/services/public-auth-session', () => ({ getPublicAuthSession: jest.fn() }));

const session = { token: 'session-token', user: { id: 'client-1', correo: 'cliente@example.com', role: 'client' } } as PublicAuthSession;

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(getPublicAuthSession).mockResolvedValue(session);
  jest.mocked(removeClientProfilePhoto).mockResolvedValue(undefined);
  jest.mocked(clearClientSessionData).mockResolvedValue(undefined);
  jest.mocked(accountDeletionService.requestCode).mockResolvedValue({ message: 'Revisa tu correo.' });
  jest.mocked(accountDeletionService.confirm).mockResolvedValue({ accepted: true, message: 'Eliminación en proceso.' });
});

it('solicitar un código nunca elimina datos ni cierra la sesión', async () => {
  const { result } = renderHook(() => useAccountDeletionViewModel());
  await waitFor(() => expect(result.current.email).toBe(session.user.correo));
  await act(async () => result.current.requestCode());
  expect(accountDeletionService.requestCode).toHaveBeenCalledWith(session.user.correo);
  expect(result.current.hasCode).toBe(true);
  expect(accountDeletionService.confirm).not.toHaveBeenCalled();
  expect(clearClientSessionData).not.toHaveBeenCalled();
});

it('exige código y confirmación explícita antes de aceptar la eliminación', async () => {
  const { result } = renderHook(() => useAccountDeletionViewModel());
  await waitFor(() => expect(result.current.email).toBe(session.user.correo));
  await act(async () => result.current.requestCode());
  await act(async () => result.current.confirm());
  expect(accountDeletionService.confirm).not.toHaveBeenCalled();
  act(() => result.current.updateCode('12345678'));
  await act(async () => result.current.confirm());
  expect(accountDeletionService.confirm).not.toHaveBeenCalled();
  act(() => result.current.toggleAcknowledged());
  await act(async () => result.current.confirm());
  expect(accountDeletionService.confirm).toHaveBeenCalledWith(session.user.correo, '12345678');
  expect(removeClientProfilePhoto).toHaveBeenCalledWith('client-1');
  expect(clearClientSessionData).toHaveBeenCalledTimes(1);
  expect(result.current.result).toBe('Eliminación en proceso.');
  expect(result.current.code).toBe('');
});

it('un código rechazado conserva la sesión y permite corregirlo', async () => {
  jest.mocked(accountDeletionService.confirm).mockRejectedValueOnce(new Error('Código vencido'));
  const { result } = renderHook(() => useAccountDeletionViewModel());
  await waitFor(() => expect(result.current.email).toBe(session.user.correo));
  await act(async () => result.current.requestCode());
  act(() => { result.current.updateCode('12345678'); result.current.toggleAcknowledged(); });
  await act(async () => result.current.confirm());
  expect(result.current.error).toBe('Código vencido');
  expect(clearClientSessionData).not.toHaveBeenCalled();
  expect(result.current.result).toBe('');
  await act(async () => result.current.confirm());
  expect(result.current.result).toBe('Eliminación en proceso.');
});

it('dos pulsaciones en el mismo render envían una sola confirmación', async () => {
  const { result } = renderHook(() => useAccountDeletionViewModel());
  await waitFor(() => expect(result.current.email).toBe(session.user.correo));
  await act(async () => result.current.requestCode());
  act(() => { result.current.updateCode('12345678'); result.current.toggleAcknowledged(); });
  await act(async () => Promise.all([result.current.confirm(), result.current.confirm()]));
  expect(accountDeletionService.confirm).toHaveBeenCalledTimes(1);
});

it('no presenta una limpieza local fallida como rechazo del servidor', async () => {
  jest.mocked(removeClientProfilePhoto).mockRejectedValueOnce(new Error('Archivo no disponible'));
  const { result } = renderHook(() => useAccountDeletionViewModel());
  await waitFor(() => expect(result.current.email).toBe(session.user.correo));
  await act(async () => result.current.requestCode());
  act(() => { result.current.updateCode('12345678'); result.current.toggleAcknowledged(); });
  await act(async () => result.current.confirm());
  expect(result.current.result).toBe('Eliminación en proceso.');
  expect(result.current.error).toBe('');
  expect(clearClientSessionData).toHaveBeenCalledTimes(1);
});

it('funciona sin sesión y no borra la sesión de otro cliente', async () => {
  jest.mocked(getPublicAuthSession).mockResolvedValue(null);
  const { result } = renderHook(() => useAccountDeletionViewModel());
  act(() => result.current.updateEmail('otro@example.com'));
  await act(async () => result.current.requestCode());
  jest.mocked(getPublicAuthSession).mockResolvedValue(session);
  act(() => { result.current.updateCode('12345678'); result.current.toggleAcknowledged(); });
  await act(async () => result.current.confirm());
  expect(clearClientSessionData).not.toHaveBeenCalled();
  expect(removeClientProfilePhoto).not.toHaveBeenCalled();
});

it('cancelar la pantalla no envía solicitudes', async () => {
  const onBack = jest.fn();
  const screen = render(<AccountDeletionScreen onBack={onBack} onHome={jest.fn()} />);
  await waitFor(() => expect(screen.getByLabelText('Correo de la cuenta').props.value).toBe(session.user.correo));
  fireEvent.press(screen.getByText('Cancelar y volver'));
  expect(onBack).toHaveBeenCalledTimes(1);
  expect(accountDeletionService.requestCode).not.toHaveBeenCalled();
  expect(accountDeletionService.confirm).not.toHaveBeenCalled();
});

it('muestra el código y exige aceptación antes de confirmar desde la pantalla', async () => {
  const onHome = jest.fn();
  const screen = render(<AccountDeletionScreen onBack={jest.fn()} onHome={onHome} />);
  await waitFor(() => expect(screen.getByLabelText('Correo de la cuenta').props.value).toBe(session.user.correo));

  fireEvent.press(screen.getByText('Enviar código de confirmación'));
  await waitFor(() => expect(screen.getByLabelText('Código de eliminación')).toBeTruthy());
  expect(screen.getByText('Revisa tu correo.')).toBeTruthy();
  expect(accountDeletionService.confirm).not.toHaveBeenCalled();

  fireEvent.changeText(screen.getByLabelText('Código de eliminación'), '12345678');
  fireEvent.press(screen.getByLabelText('Confirmo que quiero eliminar permanentemente mi cuenta y mis datos'));
  fireEvent.press(screen.getByText('Eliminar mi cuenta permanentemente'));

  await waitFor(() => expect(screen.getByText('Eliminación en proceso.')).toBeTruthy());
  expect(accountDeletionService.confirm).toHaveBeenCalledWith(session.user.correo, '12345678');
  fireEvent.press(screen.getByText('Ir al inicio'));
  expect(onHome).toHaveBeenCalledTimes(1);
});
