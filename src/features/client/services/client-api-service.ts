import type {
  ClientAppointment,
  ClientAppointmentMutationResult,
  ClientAppointmentPaymentStatus,
  ClientAppointmentStatus,
  CreateClientAppointmentInput,
  ReprogramClientAppointmentInput,
} from '@/features/client/models/client-appointment';
import type {
  ClientNotification,
  ClientNotificationChannel,
  ClientNotificationOrigin,
  ClientNotificationPreferences,
  ClientNotificationSettings,
  ClientNotificationStatus,
  ClientReminderAdvance,
  ClientReminderSettings,
  PrepareClientNotificationInput,
  PrepareClientNotificationResult,
  UpdateClientNotificationPreferencesResult,
  UpdateClientReminderResult,
} from '@/features/client/models/client-notification';
import type {
  ClientPayment,
  ClientPaymentConfig,
  ClientPaymentCustomer,
  ClientPaymentDetail,
  ClientPaymentMethod,
  ClientPaymentProof,
  ClientPaymentStatus,
  ClientPaymentType,
  CreateClientPaymentInput,
  CreateClientPaymentResult,
} from '@/features/client/models/client-payment';
import type {
  ClientAvailabilityDay,
  ClientBlockedPeriod,
  ClientStylist,
  ClientStylistAvailability,
  ClientStylistAvailabilityQuery,
  ClientStylistAvailabilityResult,
  ClientWeekday,
  ClientWeeklyScheduleDay,
} from '@/features/client/models/client-stylist';
import type {
  ClientAccountStatus,
  ClientUser,
  LinkClientGoogleResult,
  UpdateClientProfileInput,
  UpdateClientProfileResult,
} from '@/features/client/models/client-user';
import { clearClientSessionData } from '@/features/client/services/client-session-service';
import { getPublicAuthSession } from '@/features/public/auth/services/public-auth-session';
import { PUBLIC_API_BASE_URL } from '@/features/public/services/public-api-service';

const CLIENT_API_BASE_URL = `${PUBLIC_API_BASE_URL}/client`;
const REQUEST_TIMEOUT_MS = 30_000;

type UnknownRecord = Record<string, unknown>;

export type ClientApiErrorCode =
  | 'access-denied'
  | 'invalid-request'
  | 'invalid-response'
  | 'network'
  | 'request-failed'
  | 'session-required'
  | 'timeout';

export class ClientApiError extends Error {
  readonly backendCode: string;
  readonly code: ClientApiErrorCode;
  readonly details: string[];
  readonly payload?: unknown;
  readonly status: number | null;

  constructor(
    message: string,
    options: {
      backendCode?: string;
      code?: ClientApiErrorCode;
      details?: string[];
      payload?: unknown;
      status?: number | null;
    } = {},
  ) {
    super(message);
    this.name = 'ClientApiError';
    this.backendCode = options.backendCode ?? '';
    this.code = options.code ?? 'request-failed';
    this.details = options.details ?? [];
    this.payload = options.payload;
    this.status = options.status ?? null;
  }
}

class InvalidClientApiResponseError extends Error {}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function expectRecord(value: unknown, context: string): UnknownRecord {
  if (!isRecord(value)) {
    throw new InvalidClientApiResponseError(`Formato inválido en ${context}.`);
  }
  return value;
}

function expectArray(value: unknown, context: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new InvalidClientApiResponseError(`Formato inválido en ${context}.`);
  }
  return value;
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function requiredString(value: unknown, context: string): string {
  const result = stringValue(value);
  if (!result) {
    throw new InvalidClientApiResponseError(`Falta ${context} en la respuesta.`);
  }
  return result;
}

function nullableString(value: unknown): string | null {
  return value === null || value === undefined ? null : stringValue(value) || null;
}

function finiteNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function nonNegativeNumber(value: unknown, fallback = 0): number {
  return Math.max(0, finiteNumber(value, fallback));
}

function booleanValue(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === 1 || value === '1') return true;
  if (value === 'false' || value === 0 || value === '0') return false;
  return fallback;
}

function enumValue<const TValues extends readonly string[]>(
  value: unknown,
  values: TValues,
  fallback: TValues[number],
): TValues[number] {
  const normalized = stringValue(value);
  return values.includes(normalized as TValues[number])
    ? normalized as TValues[number]
    : fallback;
}

function requiredIdentifier(value: string, label: string): string {
  const identifier = value.trim();
  if (identifier) return identifier;
  throw new ClientApiError(`${label} es obligatorio.`, { code: 'invalid-request' });
}

function errorMessages(payload: unknown): string[] {
  if (!isRecord(payload)) return [];

  const messages: string[] = [];
  const errors = payload.errors;
  if (Array.isArray(errors)) {
    for (const item of errors) {
      if (typeof item === 'string' && item.trim()) {
        messages.push(item.trim());
        continue;
      }
      if (isRecord(item)) {
        const nested = stringValue(item.message) || stringValue(item.msg);
        if (nested) messages.push(nested);
      }
    }
  } else if (typeof errors === 'string' && errors.trim()) {
    messages.push(errors.trim());
  }

  if (!messages.length) {
    const singleMessage = stringValue(payload.error) || stringValue(payload.message);
    if (singleMessage) messages.push(singleMessage);
  }

  return Array.from(new Set(messages));
}

function backendErrorCode(payload: unknown) {
  return isRecord(payload) ? stringValue(payload.code) : '';
}

const SECONDARY_AUTHENTICATION_ERROR_CODES = new Set([
  'FIREBASE_ID_TOKEN_REJECTED',
  'GOOGLE_REAUTHENTICATION_REQUIRED',
  'PASSWORD_REAUTHENTICATION_REQUIRED',
]);

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== 'undefined' && value instanceof FormData;
}

async function authenticatedRequest<T>(
  path: string,
  parser: (payload: unknown) => T,
  options: { body?: BodyInit; method?: 'GET' | 'POST' | 'PUT' } = {},
): Promise<T> {
  const session = await getPublicAuthSession();
  if (!session?.token.trim()) {
    throw new ClientApiError('Inicia sesión para continuar.', {
      code: 'session-required',
      status: 401,
    });
  }
  if (session.user.role !== 'client') {
    throw new ClientApiError('Esta sección está disponible únicamente para clientes.', {
      code: 'access-denied',
      status: 403,
    });
  }

  const controller = new AbortController();
  let didTimeout = false;
  const timeoutId = setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${CLIENT_API_BASE_URL}${path}`, {
      body: options.body,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${session.token}`,
        ...(options.body && !isFormData(options.body)
          ? { 'Content-Type': 'application/json' }
          : {}),
      },
      method: options.method ?? 'GET',
      signal: controller.signal,
    });
    const payload: unknown = await response.json().catch(() => undefined);

    if (!response.ok) {
      const backendCode = backendErrorCode(payload);
      const sessionIsInvalid = response.status === 401 &&
        !SECONDARY_AUTHENTICATION_ERROR_CODES.has(backendCode);
      if (sessionIsInvalid) {
        await clearClientSessionData();
      }

      const details = errorMessages(payload);
      throw new ClientApiError(details[0] || 'No fue posible procesar la solicitud.', {
        backendCode,
        code: sessionIsInvalid
          ? 'session-required'
          : response.status === 403
            ? 'access-denied'
            : 'request-failed',
        details,
        payload,
        status: response.status,
      });
    }

    try {
      return parser(payload);
    } catch (error) {
      if (error instanceof ClientApiError) throw error;
      throw new ClientApiError('El servidor respondió con un formato inesperado.', {
        code: 'invalid-response',
        payload,
        status: response.status,
      });
    }
  } catch (error) {
    if (error instanceof ClientApiError) throw error;
    if (didTimeout || (error instanceof Error && error.name === 'AbortError')) {
      throw new ClientApiError('El servidor tardó demasiado en responder. Intenta nuevamente.', {
        code: 'timeout',
      });
    }
    throw new ClientApiError(
      'No fue posible conectar con el servidor. Revisa tu conexión e intenta nuevamente.',
      { code: 'network' },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

const ACCOUNT_STATUSES = ['active', 'inactive', 'pending'] as const;

function parseClientUser(value: unknown): ClientUser {
  const record = expectRecord(value, 'cliente');
  const role = stringValue(record.role);
  if (role && role !== 'client') {
    throw new InvalidClientApiResponseError('El usuario recibido no es cliente.');
  }
  const rawAccountStatus = stringValue(record.accountStatus);
  const accountStatus = ACCOUNT_STATUSES.includes(rawAccountStatus as ClientAccountStatus)
    ? rawAccountStatus as ClientAccountStatus
    : undefined;
  const firstName = stringValue(record.nombre);
  const paternalLastName = stringValue(record.apellidoPaterno);
  const email = stringValue(record.correo);
  const phone = stringValue(record.telefono);
  const missingProfileFields = Array.isArray(record.missingProfileFields)
    ? record.missingProfileFields.map(stringValue).filter(Boolean)
    : [];
  const profileComplete = typeof record.profileComplete === 'boolean'
    ? record.profileComplete
    : Boolean(firstName && paternalLastName && email && /^\d{10}$/.test(phone));

  return {
    accountStatus,
    email,
    firstName,
    googleLinked: booleanValue(record.googleLinked),
    id: requiredString(record.id, 'el identificador del cliente'),
    maternalLastName: stringValue(record.apellidoMaterno),
    missingProfileFields,
    paternalLastName,
    phone,
    profileComplete,
    role: 'client',
  };
}

function parseStylist(value: unknown): ClientStylist {
  const record = expectRecord(value, 'estilista');
  return {
    email: stringValue(record.email),
    id: requiredString(record.id, 'el identificador del estilista'),
    name: stringValue(record.nombre) || 'Estilista',
    phone: stringValue(record.telefono),
    staffId: stringValue(record.staffId),
  };
}

function parseWeekday(value: unknown): ClientWeekday {
  const day = finiteNumber(value, -1);
  if (Number.isInteger(day) && day >= 0 && day <= 6) return day as ClientWeekday;
  throw new InvalidClientApiResponseError('Día semanal inválido.');
}

function parseWeeklyScheduleDay(value: unknown): ClientWeeklyScheduleDay {
  const record = expectRecord(value, 'horario semanal');
  return {
    breakEnd: stringValue(record.breakEnd),
    breakStart: stringValue(record.breakStart),
    day: parseWeekday(record.day),
    enabled: booleanValue(record.enabled),
    endTime: stringValue(record.endTime),
    startTime: stringValue(record.startTime),
  };
}

function parseBlockedPeriod(value: unknown): ClientBlockedPeriod {
  const record = expectRecord(value, 'periodo bloqueado');
  return {
    allDay: booleanValue(record.allDay, true),
    endDate: stringValue(record.endDate),
    endTime: stringValue(record.endTime),
    id: stringValue(record.id),
    reason: stringValue(record.reason),
    startDate: stringValue(record.startDate),
    startTime: stringValue(record.startTime),
  };
}

function parseStylistAvailability(value: unknown): ClientStylistAvailability {
  const record = expectRecord(value, 'disponibilidad');
  return {
    blockedPeriods: expectArray(record.blockedPeriods, 'periodos bloqueados').map(parseBlockedPeriod),
    id: stringValue(record.id),
    slotMinutes: Math.max(15, Math.round(finiteNumber(record.slotMinutes, 30))),
    stylistId: requiredString(record.stylistId, 'el estilista de la disponibilidad'),
    weeklySchedule: expectArray(record.weeklySchedule, 'horario semanal').map(parseWeeklyScheduleDay),
  };
}

function parseAvailabilityDay(value: unknown): ClientAvailabilityDay {
  const record = expectRecord(value, 'día disponible');
  return {
    available: booleanValue(record.available),
    date: requiredString(record.date, 'la fecha de disponibilidad'),
    reason: stringValue(record.reason),
    slots: expectArray(record.slots, 'horarios disponibles')
      .map(stringValue)
      .filter(Boolean),
  };
}

const APPOINTMENT_STATUSES = ['pendiente', 'confirmada', 'completada', 'cancelada'] as const;
const APPOINTMENT_PAYMENT_STATUSES = ['Sin pago', 'Pendiente', 'Pagado', 'Rechazado'] as const;

function parseAppointment(value: unknown): ClientAppointment {
  const record = expectRecord(value, 'cita');
  const rawStatus = stringValue(record.estado);
  const normalizedStatus = rawStatus === 'programada' ? 'pendiente' : rawStatus;

  return {
    createdAt: stringValue(record.createdAt),
    dateTime: requiredString(record.fechaHora, 'la fecha de la cita'),
    durationMinutes: Math.max(15, Math.round(finiteNumber(record.duracionMinutos, 30))),
    id: requiredString(record.id, 'el identificador de la cita'),
    notes: stringValue(record.notas),
    paidAt: nullableString(record.pagadoAt),
    paymentId: stringValue(record.paymentId),
    paymentStatus: enumValue(
      record.estatusPago,
      APPOINTMENT_PAYMENT_STATUSES,
      'Sin pago',
    ) as ClientAppointmentPaymentStatus,
    serviceId: stringValue(record.serviceId),
    serviceName: stringValue(record.servicio),
    servicePrice: nonNegativeNumber(record.servicioPrecio),
    status: enumValue(
      normalizedStatus,
      APPOINTMENT_STATUSES,
      'pendiente',
    ) as ClientAppointmentStatus,
    stylistId: stringValue(record.stylistId),
    updatedAt: stringValue(record.updatedAt),
  };
}

const NOTIFICATION_CHANNELS = ['Email', 'WhatsApp', 'Notificacion interna'] as const;
const REMINDER_ADVANCES = ['24 horas antes', '12 horas antes', '2 horas antes'] as const;
const NOTIFICATION_STATUSES = [
  'preparada',
  'enviada',
  'lista_whatsapp',
  'fallida',
  'cancelada',
] as const;
const NOTIFICATION_ORIGINS = ['manual', 'automatico'] as const;

function parseReminderSettings(value: unknown): ClientReminderSettings {
  const record = expectRecord(value, 'recordatorio');
  return {
    advance: enumValue(
      record.anticipacion,
      REMINDER_ADVANCES,
      '24 horas antes',
    ) as ClientReminderAdvance,
    channel: enumValue(record.canal, NOTIFICATION_CHANNELS, 'Email') as ClientNotificationChannel,
  };
}

function parseNotificationPreferences(value: unknown): ClientNotificationPreferences {
  const record = expectRecord(value, 'preferencias de notificación');
  return {
    appointmentChanges: booleanValue(record.appointmentChanges, true),
    appointmentReminders: booleanValue(record.appointmentReminders, true),
    promotions: booleanValue(record.promotions, true),
  };
}

function parseNotification(value: unknown): ClientNotification {
  const record = expectRecord(value, 'notificación');
  return {
    advance: stringValue(record.anticipacion),
    appointmentId: stringValue(record.appointmentId),
    channel: enumValue(record.canal, NOTIFICATION_CHANNELS, 'Email') as ClientNotificationChannel,
    createdAt: stringValue(record.createdAt),
    destination: stringValue(record.destinatario),
    errorMessage: stringValue(record.errorEnvio),
    id: requiredString(record.id, 'el identificador de la notificación'),
    message: stringValue(record.mensaje),
    origin: enumValue(record.origen, NOTIFICATION_ORIGINS, 'manual') as ClientNotificationOrigin,
    sentAt: nullableString(record.enviadoAt),
    status: enumValue(record.estado, NOTIFICATION_STATUSES, 'preparada') as ClientNotificationStatus,
    targetDate: nullableString(record.fechaObjetivo),
    type: stringValue(record.tipo) || 'recordatorio_cita',
    whatsappUrl: stringValue(record.whatsappUrl),
  };
}

const PAYMENT_TYPES = ['Producto', 'Servicio'] as const;
const PAYMENT_METHODS = ['Tarjeta', 'Transferencia', 'Pago en sucursal'] as const;
const PAYMENT_STATUSES = ['Pendiente', 'Procesando', 'Pagado', 'Confirmado', 'Rechazado'] as const;

function parsePaymentDetail(value: unknown): ClientPaymentDetail {
  const record = expectRecord(value, 'detalle del pago');
  return {
    itemId: stringValue(record.itemId),
    name: stringValue(record.nombre),
    price: nonNegativeNumber(record.precio),
    quantity: Math.max(1, Math.floor(finiteNumber(record.cantidad, 1))),
    subtotal: nonNegativeNumber(record.subtotal),
  };
}

function parsePaymentCustomer(value: unknown): ClientPaymentCustomer {
  const record = isRecord(value) ? value : {};
  return {
    email: stringValue(record.correo),
    name: stringValue(record.nombre),
    phone: stringValue(record.telefono),
  };
}

function parsePayment(value: unknown): ClientPayment {
  const record = expectRecord(value, 'pago');
  return {
    appointmentId: stringValue(record.appointmentId),
    concept: stringValue(record.concepto),
    createdAt: stringValue(record.createdAt),
    customer: parsePaymentCustomer(record.cliente),
    date: stringValue(record.fecha),
    details: expectArray(record.detalle, 'detalle del pago').map(parsePaymentDetail),
    id: requiredString(record.id, 'el identificador del pago'),
    method: enumValue(record.metodo, PAYMENT_METHODS, 'Transferencia') as ClientPaymentMethod,
    notes: stringValue(record.notas),
    proofUrl: stringValue(record.comprobanteUrl),
    reference: stringValue(record.referencia),
    reviewedAt: nullableString(record.revisadoAt),
    reviewedBy: stringValue(record.revisadoPor),
    reviewNotes: stringValue(record.notasAdmin),
    saleId: stringValue(record.saleId),
    status: enumValue(record.estatus, PAYMENT_STATUSES, 'Pendiente') as ClientPaymentStatus,
    total: nonNegativeNumber(record.total),
    type: enumValue(record.tipo, PAYMENT_TYPES, 'Producto') as ClientPaymentType,
  };
}

function parseMessage(value: unknown): string {
  return stringValue(expectRecord(value, 'respuesta').message);
}

function paymentRequestBody(input: CreateClientPaymentInput) {
  return {
    appointmentId: input.appointmentId?.trim() || undefined,
    detalle: input.items.map((item) => ({
      cantidad: Math.max(1, Math.floor(item.quantity)),
      itemId: item.itemId.trim(),
    })),
    metodo: input.method,
    notas: input.notes?.trim() || undefined,
    referencia: input.reference?.trim() || undefined,
    tipo: input.type,
  };
}

export function buildClientPaymentFormData(
  input: CreateClientPaymentInput,
  proof?: ClientPaymentProof,
): FormData {
  const body = paymentRequestBody(input);
  const formData = new FormData();
  formData.append('tipo', body.tipo);
  formData.append('metodo', body.metodo);
  formData.append('detalle', JSON.stringify(body.detalle));
  if (body.appointmentId) formData.append('appointmentId', body.appointmentId);
  if (body.referencia) formData.append('referencia', body.referencia);
  if (body.notas) formData.append('notas', body.notas);
  if (proof) {
    formData.append('comprobante', {
      name: proof.name,
      type: proof.mimeType,
      uri: proof.uri,
    } as unknown as Blob);
  }
  return formData;
}

export const clientApiService = {
  getMe() {
    return authenticatedRequest('/me', (payload) => {
      const response = expectRecord(payload, 'perfil');
      return parseClientUser(response.user);
    });
  },

  getStylists() {
    return authenticatedRequest('/stylists', (payload) => {
      const response = expectRecord(payload, 'estilistas');
      return expectArray(response.stylists, 'estilistas').map(parseStylist);
    });
  },

  getStylistAvailability(query: ClientStylistAvailabilityQuery) {
    const stylistId = requiredIdentifier(query.stylistId, 'El estilista');
    const parameters = new URLSearchParams({
      desde: query.fromDate.trim(),
      hasta: query.toDate.trim(),
    });
    if (query.serviceId?.trim()) parameters.set('serviceId', query.serviceId.trim());

    return authenticatedRequest(
      `/stylists/${encodeURIComponent(stylistId)}/availability?${parameters.toString()}`,
      (payload): ClientStylistAvailabilityResult => {
        const response = expectRecord(payload, 'disponibilidad del estilista');
        return {
          availability: parseStylistAvailability(response.availability),
          days: expectArray(response.days, 'días disponibles').map(parseAvailabilityDay),
          stylist: parseStylist(response.stylist),
        };
      },
    );
  },

  updateProfile(input: UpdateClientProfileInput) {
    return authenticatedRequest(
      '/profile',
      (payload): UpdateClientProfileResult => {
        const response = expectRecord(payload, 'actualización del perfil');
        return { message: parseMessage(response), user: parseClientUser(response.user) };
      },
      {
        body: JSON.stringify({
          apellidoMaterno: input.maternalLastName,
          apellidoPaterno: input.paternalLastName,
          correo: input.email,
          nombre: input.firstName,
          telefono: input.phone,
        }),
        method: 'POST',
      },
    );
  },

  linkGoogle(firebaseIdToken: string) {
    const idToken = requiredIdentifier(firebaseIdToken, 'El token de Firebase');
    return authenticatedRequest(
      '/google-link',
      (payload): LinkClientGoogleResult => {
        const response = expectRecord(payload, 'vinculación con Google');
        return {
          message: parseMessage(response),
          token: requiredString(response.token, 'el token de sesión'),
          user: parseClientUser(response.user),
        };
      },
      {
        body: JSON.stringify({ firebaseIdToken: idToken }),
        method: 'POST',
      },
    );
  },

  getNotificationSettings() {
    return authenticatedRequest('/notification-settings', (payload): ClientNotificationSettings => {
      const response = expectRecord(payload, 'configuración de notificaciones');
      return {
        preferences: parseNotificationPreferences(response.notificationPreferences),
        reminder: parseReminderSettings(response.reminderSettings),
      };
    });
  },

  updateReminderSettings(input: ClientReminderSettings) {
    return authenticatedRequest(
      '/reminder-settings',
      (payload): UpdateClientReminderResult => {
        const response = expectRecord(payload, 'configuración del recordatorio');
        return {
          message: parseMessage(response),
          reminder: parseReminderSettings(response.reminderSettings),
        };
      },
      {
        body: JSON.stringify({ anticipacion: input.advance, canal: input.channel }),
        method: 'PUT',
      },
    );
  },

  updateNotificationPreferences(input: ClientNotificationPreferences) {
    return authenticatedRequest(
      '/notification-preferences',
      (payload): UpdateClientNotificationPreferencesResult => {
        const response = expectRecord(payload, 'preferencias de notificación');
        return {
          message: parseMessage(response),
          preferences: parseNotificationPreferences(response.notificationPreferences),
        };
      },
      { body: JSON.stringify(input), method: 'PUT' },
    );
  },

  getNotifications() {
    return authenticatedRequest('/notifications', (payload) => {
      const response = expectRecord(payload, 'notificaciones');
      return expectArray(response.notifications, 'notificaciones').map(parseNotification);
    });
  },

  prepareNotification(input: PrepareClientNotificationInput) {
    return authenticatedRequest(
      '/notifications/prepare',
      (payload): PrepareClientNotificationResult => {
        const response = expectRecord(payload, 'notificación preparada');
        return {
          message: parseMessage(response),
          notification: parseNotification(response.notification),
        };
      },
      {
        body: JSON.stringify({
          appointmentId: input.appointmentId,
          messageText: input.message,
        }),
        method: 'POST',
      },
    );
  },

  getPayments() {
    return authenticatedRequest('/payments', (payload) => {
      const response = expectRecord(payload, 'pagos');
      return expectArray(response.payments, 'pagos').map(parsePayment);
    });
  },

  getPaymentConfig() {
    return authenticatedRequest('/payment-config', (payload): ClientPaymentConfig => {
      const response = expectRecord(payload, 'configuración de pago');
      const bankTransfer = expectRecord(response.bankTransfer, 'transferencia bancaria');
      return {
        bankTransfer: {
          account: stringValue(bankTransfer.account),
          bank: stringValue(bankTransfer.bank),
          beneficiary: stringValue(bankTransfer.beneficiary),
          clabe: stringValue(bankTransfer.clabe),
          isDemo: booleanValue(bankTransfer.isDemo),
          message: stringValue(bankTransfer.message),
        },
      };
    });
  },

  createPayment(
    input: CreateClientPaymentInput | FormData,
    proof?: ClientPaymentProof,
  ) {
    const body = isFormData(input)
      ? input
      : proof
        ? buildClientPaymentFormData(input, proof)
        : JSON.stringify(paymentRequestBody(input));

    return authenticatedRequest(
      '/payments',
      (payload): CreateClientPaymentResult => {
        const response = expectRecord(payload, 'pago creado');
        return { message: parseMessage(response), payment: parsePayment(response.payment) };
      },
      { body, method: 'POST' },
    );
  },

  getAppointments() {
    return authenticatedRequest('/appointments', (payload) => {
      const response = expectRecord(payload, 'citas');
      return expectArray(response.appointments, 'citas').map(parseAppointment);
    });
  },

  createAppointment(input: CreateClientAppointmentInput) {
    return authenticatedRequest(
      '/appointments',
      (payload): ClientAppointmentMutationResult => {
        const response = expectRecord(payload, 'cita creada');
        return { appointment: parseAppointment(response.appointment), message: parseMessage(response) };
      },
      {
        body: JSON.stringify({
          fecha: input.date,
          hora: input.time,
          notas: input.notes ?? '',
          serviceId: input.serviceId ?? '',
          servicio: input.serviceName ?? '',
          stylistId: input.stylistId ?? '',
        }),
        method: 'POST',
      },
    );
  },

  reprogramAppointment(appointmentId: string, input: ReprogramClientAppointmentInput) {
    const id = requiredIdentifier(appointmentId, 'La cita');
    return authenticatedRequest(
      `/appointments/${encodeURIComponent(id)}/reprogram`,
      (payload): ClientAppointmentMutationResult => {
        const response = expectRecord(payload, 'cita reprogramada');
        return { appointment: parseAppointment(response.appointment), message: parseMessage(response) };
      },
      {
        body: JSON.stringify({
          fecha: input.date,
          hora: input.time,
          stylistId: input.stylistId ?? '',
        }),
        method: 'POST',
      },
    );
  },

  cancelAppointment(appointmentId: string) {
    const id = requiredIdentifier(appointmentId, 'La cita');
    return authenticatedRequest(
      `/appointments/${encodeURIComponent(id)}/cancel`,
      (payload): ClientAppointmentMutationResult => {
        const response = expectRecord(payload, 'cita cancelada');
        return { appointment: parseAppointment(response.appointment), message: parseMessage(response) };
      },
      { method: 'POST' },
    );
  },
};
