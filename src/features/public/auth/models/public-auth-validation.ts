import type {
  FormErrors,
  LoginForm,
  RecoverPasswordForm,
  RegisterForm,
  ResetPasswordForm,
} from '@/features/public/auth/models/public-auth-models';

const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const NAME_PATTERN = /^[A-Za-zÁÉÍÓÚÑÜáéíóúñü\s'-]{2,60}$/;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const PHONE_PATTERN = /^\d{10}$/;

export const PASSWORD_REQUIREMENTS =
  'Mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo.';

function required(value: string, label: string) {
  return value.trim() ? '' : `${label} es obligatorio.`;
}

function validateName(value: string, label: string) {
  const missingMessage = required(value, label);
  if (missingMessage) return missingMessage;
  return NAME_PATTERN.test(value.trim())
    ? ''
    : `${label} debe contener solo letras y tener entre 2 y 60 caracteres.`;
}

function validateEmail(value: string) {
  const missingMessage = required(value, 'El correo');
  if (missingMessage) return missingMessage;
  return EMAIL_PATTERN.test(value.trim()) ? '' : 'Ingresa un correo electrónico válido.';
}

function validatePassword(value: string) {
  const missingMessage = required(value, 'La contraseña');
  if (missingMessage) return missingMessage;
  return PASSWORD_PATTERN.test(value) ? '' : PASSWORD_REQUIREMENTS;
}

function addError<TForm>(errors: FormErrors<TForm>, field: keyof TForm, message: string) {
  if (message) errors[field] = message;
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function validateLoginForm(form: LoginForm) {
  const errors: FormErrors<LoginForm> = {};
  addError(errors, 'correo', validateEmail(form.correo));
  addError(errors, 'password', required(form.password, 'La contraseña'));
  return errors;
}

export function validateRegisterForm(form: RegisterForm) {
  const errors: FormErrors<RegisterForm> = {};

  addError(errors, 'nombre', validateName(form.nombre, 'El nombre'));
  addError(errors, 'apellidoPaterno', validateName(form.apellidoPaterno, 'El apellido paterno'));
  addError(errors, 'apellidoMaterno', validateName(form.apellidoMaterno, 'El apellido materno'));
  addError(
    errors,
    'telefono',
    PHONE_PATTERN.test(form.telefono) ? '' : 'El teléfono debe tener exactamente 10 dígitos.',
  );
  addError(errors, 'correo', validateEmail(form.correo));
  addError(errors, 'password', validatePassword(form.password));

  if (!form.confirmarPassword) {
    errors.confirmarPassword = 'Confirma tu contraseña.';
  } else if (form.confirmarPassword !== form.password) {
    errors.confirmarPassword = 'Las contraseñas no coinciden.';
  }

  if (!form.aceptaPrivacidad) {
    errors.aceptaPrivacidad = 'Debes aceptar el aviso de privacidad para continuar.';
  }

  return errors;
}

export function validateRecoverPasswordForm(form: RecoverPasswordForm) {
  const errors: FormErrors<RecoverPasswordForm> = {};
  addError(errors, 'correo', validateEmail(form.correo));
  return errors;
}

export function validateResetPasswordForm(form: ResetPasswordForm) {
  const errors: FormErrors<ResetPasswordForm> = {};
  addError(errors, 'password', validatePassword(form.password));

  if (!form.confirmarPassword) {
    errors.confirmarPassword = 'Confirma tu nueva contraseña.';
  } else if (form.confirmarPassword !== form.password) {
    errors.confirmarPassword = 'Las contraseñas no coinciden.';
  }

  return errors;
}

export function hasFormErrors<TForm>(errors: FormErrors<TForm>) {
  return Object.keys(errors).length > 0;
}
