/// <reference types="jest" />
import {
  PASSWORD_REQUIREMENTS,
  hasFormErrors,
  normalizeEmail,
  validateLoginForm,
  validateRecoverPasswordForm,
  validateRegisterForm,
  validateResetPasswordForm,
} from '../src/features/public/auth/models/public-auth-validation';
import type { RegisterForm } from '../src/features/public/auth/models/public-auth-models';

const validRegistration: RegisterForm = {
  nombre: 'Ana',
  apellidoPaterno: 'López',
  apellidoMaterno: 'Ruiz',
  telefono: '5512345678',
  correo: 'ana@example.com',
  password: 'Clave123!',
  confirmarPassword: 'Clave123!',
  aceptaPrivacidad: true,
};

describe('normalización y validación de autenticación', () => {
  it('quita espacios y convierte el correo a minúsculas', () => {
    expect(normalizeEmail('  Ana.Lopez@EXAMPLE.COM  ')).toBe('ana.lopez@example.com');
  });

  it('acepta un inicio de sesión con correo válido y contraseña no vacía', () => {
    expect(validateLoginForm({ correo: ' ANA@example.com ', password: 'cualquiera' })).toEqual({});
  });

  it('detecta correo incorrecto y contraseña vacía en inicio de sesión', () => {
    expect(validateLoginForm({ correo: 'correo-invalido', password: '   ' })).toEqual({
      correo: 'Ingresa un correo electrónico válido.',
      password: 'La contraseña es obligatorio.',
    });
  });

  it('detecta los campos obligatorios vacíos en el registro', () => {
    expect(validateRegisterForm({
      nombre: '', apellidoPaterno: ' ', apellidoMaterno: '', telefono: '',
      correo: '', password: '', confirmarPassword: '', aceptaPrivacidad: false,
    })).toEqual({
      nombre: 'El nombre es obligatorio.',
      apellidoPaterno: 'El apellido paterno es obligatorio.',
      apellidoMaterno: 'El apellido materno es obligatorio.',
      telefono: 'El teléfono debe tener exactamente 10 dígitos.',
      correo: 'El correo es obligatorio.',
      password: 'La contraseña es obligatorio.',
      confirmarPassword: 'Confirma tu contraseña.',
      aceptaPrivacidad: 'Debes aceptar el aviso de privacidad para continuar.',
    });
  });

  it('acepta un registro completo con contraseña válida', () => {
    expect(validateRegisterForm(validRegistration)).toEqual({});
  });

  it('rechaza contraseñas con requisitos incompletos en el registro', () => {
    for (const password of ['Ab1!', 'clave123!', 'Claveabcd!', 'Clave1234']) {
      expect(validateRegisterForm({
        ...validRegistration,
        password,
        confirmarPassword: password,
      }).password).toBe(PASSWORD_REQUIREMENTS);
    }
  });

  it('detecta nombres y teléfonos incorrectos', () => {
    expect(validateRegisterForm({
      ...validRegistration, nombre: 'A1', telefono: '123',
    })).toMatchObject({
      nombre: 'El nombre debe contener solo letras y tener entre 2 y 60 caracteres.',
      telefono: 'El teléfono debe tener exactamente 10 dígitos.',
    });
  });

  it('detecta contraseñas distintas y privacidad no aceptada', () => {
    expect(validateRegisterForm({
      ...validRegistration, confirmarPassword: 'Otra123!', aceptaPrivacidad: false,
    })).toMatchObject({
      confirmarPassword: 'Las contraseñas no coinciden.',
      aceptaPrivacidad: 'Debes aceptar el aviso de privacidad para continuar.',
    });
  });

  it('valida correo vacío e incorrecto para recuperación', () => {
    expect(validateRecoverPasswordForm({ correo: ' ' }).correo).toBe('El correo es obligatorio.');
    expect(validateRecoverPasswordForm({ correo: 'sin-arroba' }).correo).toBe('Ingresa un correo electrónico válido.');
    expect(validateRecoverPasswordForm({ correo: 'ana@example.com' })).toEqual({});
  });

  it('valida contraseña y confirmación al restablecerla', () => {
    expect(validateResetPasswordForm({ password: '', confirmarPassword: '' })).toEqual({
      password: 'La contraseña es obligatorio.',
      confirmarPassword: 'Confirma tu nueva contraseña.',
    });
    expect(validateResetPasswordForm({ password: 'Clave123!', confirmarPassword: 'Otra123!' }).confirmarPassword)
      .toBe('Las contraseñas no coinciden.');
    expect(validateResetPasswordForm({ password: 'Clave123!', confirmarPassword: 'Clave123!' })).toEqual({});
  });

  it('distingue formularios con y sin errores', () => {
    expect(hasFormErrors(validateLoginForm({ correo: 'mal', password: '' }))).toBe(true);
    expect(hasFormErrors(validateLoginForm({ correo: 'ana@example.com', password: 'x' }))).toBe(false);
  });
});
