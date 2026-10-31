/// <reference types="jest" />
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import * as WebBrowser from 'expo-web-browser';

import PrivacyPage from '../src/app/public/(tabs)/more/privacy';

import { getCompanyInformation } from '../src/features/public/services/public-api-service';
import { usePrivacyViewModel } from '../src/features/public/view-models/use-privacy-view-model';
import { PrivacyScreen } from '../src/features/public/views/privacy-screen';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn() }));
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ canGoBack: () => false, back: jest.fn(), replace: jest.fn(), push: mockPush }),
}));
jest.mock('../src/features/public/services/public-api-service', () => ({
  PUBLIC_API_BASE_URL: 'https://api.example.com/api',
  getCompanyInformation: jest.fn(() => { throw new Error('Sin conexión'); }),
}));

function Policy() {
  const vm = usePrivacyViewModel();
  return <PrivacyScreen {...vm} onBack={() => {}} onDeleteAccount={() => {}} />;
}

beforeEach(() => { jest.clearAllMocks(); });

it('muestra el aviso completo sin sesión ni consulta al servidor', () => {
  const screen = render(<Policy />);
  expect(screen.getByText('1. Responsable del tratamiento')).toBeTruthy();
  expect(screen.getByText('8. Derechos ARCO y revocación')).toBeTruthy();
  expect(screen.getByText('14. Cambios al aviso y protección de derechos')).toBeTruthy();
  expect(screen.getByText(/plazo para comunicar la determinación es de hasta 20 días hábiles/)).toBeTruthy();
  expect(getCompanyInformation).not.toHaveBeenCalled();
  expect(WebBrowser.openBrowserAsync).not.toHaveBeenCalled();
});

it('conserva el texto si falla el navegador y permite reintentar la página HTML pública', async () => {
  jest.mocked(WebBrowser.openBrowserAsync)
    .mockRejectedValueOnce(new Error('Sin conexión'))
    .mockResolvedValueOnce({ type: 'dismiss' } as Awaited<ReturnType<typeof WebBrowser.openBrowserAsync>>);
  const screen = render(<Policy />);
  fireEvent.press(screen.getByRole('button', { name: 'Ver página web pública' }));
  expect(await screen.findByRole('alert')).toBeTruthy();
  expect(screen.getByText('14. Cambios al aviso y protección de derechos')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Ver página web pública' }));
  await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  expect(WebBrowser.openBrowserAsync).toHaveBeenLastCalledWith('https://api.example.com/api/public/privacy-policy');
  expect(WebBrowser.openBrowserAsync).toHaveBeenCalledTimes(2);
});

it('abre la solicitud pública de eliminación de cuenta desde el aviso', () => {
  const screen = render(<PrivacyPage />);
  fireEvent.press(screen.getByRole('button', { name: 'Solicitar eliminación de cuenta' }));
  expect(mockPush).toHaveBeenCalledWith('/public/delete-account');
});
