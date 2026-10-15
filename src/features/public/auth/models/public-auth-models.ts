export type PublicAuthRole = 'client' | 'admin' | 'stylist';

export type PublicAuthUser = {
  accountStatus: 'active' | 'inactive' | 'pending';
  apellidoMaterno: string;
  apellidoPaterno: string;
  correo: string;
  googleLinked: boolean;
  id: string;
  missingProfileFields: string[];
  nombre: string;
  profileComplete: boolean;
  role: PublicAuthRole;
  telefono: string;
};

export type PublicAuthSession = {
  token: string;
  user: PublicAuthUser;
};

export type LoginCredentials = {
  correo: string;
  password: string;
};

export type GoogleLoginCredentials = {
  firebaseIdToken: string;
};

export type RegisterAccountData = {
  apellidoMaterno: string;
  apellidoPaterno: string;
  correo: string;
  nombre: string;
  password: string;
  telefono: string;
};

export type AuthenticatedResponse = PublicAuthSession & {
  message: string;
};

export type MessageResponse = {
  message: string;
};

export type ResetTokenUser = Pick<PublicAuthUser, 'correo' | 'nombre' | 'role'>;

export type ResetTokenResponse = {
  user: ResetTokenUser;
};

export type LoginForm = LoginCredentials;

export type RegisterForm = RegisterAccountData & {
  aceptaPrivacidad: boolean;
  confirmarPassword: string;
};

export type RecoverPasswordForm = {
  correo: string;
};

export type ResetPasswordForm = {
  confirmarPassword: string;
  password: string;
};

export type FormErrors<TForm> = Partial<Record<keyof TForm, string>>;
