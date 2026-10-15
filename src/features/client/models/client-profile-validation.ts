import type {
  ClientProfileFormErrors,
  UpdateClientProfileInput,
} from '@/features/client/models/client-user';

const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const NAME_PATTERN = /^[A-Za-zÁÉÍÓÚÑÜáéíóúñü\s'-]{2,60}$/;
const PHONE_PATTERN = /^\d{10}$/;

function validateName(value: string, label: string, required: boolean) {
  const normalized = value.trim();
  if (!normalized) return required ? `${label} es obligatorio.` : '';
  return NAME_PATTERN.test(normalized)
    ? ''
    : `${label} debe contener solo letras y tener entre 2 y 60 caracteres.`;
}

export function normalizeClientProfileInput(
  input: UpdateClientProfileInput,
): UpdateClientProfileInput {
  return {
    email: input.email.trim().toLowerCase(),
    firstName: input.firstName.trim(),
    maternalLastName: input.maternalLastName.trim(),
    paternalLastName: input.paternalLastName.trim(),
    phone: input.phone.replace(/\D/g, ''),
  };
}

export function validateClientProfile(
  input: UpdateClientProfileInput,
): ClientProfileFormErrors {
  const normalized = normalizeClientProfileInput(input);
  const errors: ClientProfileFormErrors = {};

  const firstNameError = validateName(normalized.firstName, 'El nombre', true);
  if (firstNameError) errors.firstName = firstNameError;

  const paternalLastNameError = validateName(
    normalized.paternalLastName,
    'El apellido paterno',
    true,
  );
  if (paternalLastNameError) errors.paternalLastName = paternalLastNameError;

  const maternalLastNameError = validateName(
    normalized.maternalLastName,
    'El apellido materno',
    false,
  );
  if (maternalLastNameError) errors.maternalLastName = maternalLastNameError;

  if (!normalized.email) errors.email = 'El correo es obligatorio.';
  else if (!EMAIL_PATTERN.test(normalized.email)) {
    errors.email = 'Ingresa un correo electrónico válido.';
  }

  if (!PHONE_PATTERN.test(normalized.phone)) {
    errors.phone = 'El teléfono debe tener exactamente 10 dígitos.';
  }

  return errors;
}

export function hasClientProfileErrors(errors: ClientProfileFormErrors) {
  return Object.values(errors).some(Boolean);
}
