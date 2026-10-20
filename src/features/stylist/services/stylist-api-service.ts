import { getPublicAuthSession } from '@/features/public/auth/services/public-auth-session';
import { API_BASE_URL } from '@/shared/config/api';
import { validateAvailability, type AppointmentStatus, type ScheduleBlock, type WorkDay } from '../models/stylist';
import { apiStatuses, availabilityPayload, mapStylistAppointment, mapStylistAppointments, mapStylistAvailability, mapStylistIdentity, record } from '../models/stylist-api-mappers';

export class StylistApiError extends Error {
  constructor(message: string, readonly status = 0) { super(message); this.name = 'StylistApiError'; }
}

async function request(path: string, method = 'GET', body?: unknown) {
  const session = await getPublicAuthSession();
  if (!session?.token) throw new StylistApiError('Inicia sesión para continuar.', 401);
  if (session.user.role !== 'stylist') throw new StylistApiError('Esta sección es exclusiva para estilistas.', 403);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  try {
    const response = await fetch(`${API_BASE_URL}/stylist${path}`, {
      method, signal: controller.signal,
      headers: { Accept: 'application/json', Authorization: `Bearer ${session.token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const value = payload && typeof payload === 'object' ? record(payload) : {};
      const message = Array.isArray(value.errors) ? value.errors.filter((item): item is string => typeof item === 'string').join(' ') : value.message;
      throw new StylistApiError(typeof message === 'string' && message ? message : 'No fue posible completar la solicitud.', response.status);
    }
    if (!payload) throw new StylistApiError('El servidor devolvió una respuesta vacía.');
    return payload;
  } catch (error) {
    if (error instanceof StylistApiError) throw error;
    throw new StylistApiError(controller.signal.aborted ? 'El servidor tardó demasiado. Reintenta para comprobar el estado actual.' : 'No fue posible conectar con el servidor. Revisa tu conexión.');
  } finally { clearTimeout(timeout); }
}

export const stylistApiService = {
  async getSnapshot() {
    const [profile, availability] = await Promise.all([request('/me'), request('/availability')]);
    const schedule = mapStylistAvailability(availability);
    const appointments = mapStylistAppointments(await request('/appointments'), schedule.interval);
    return { ...schedule, appointments, identity: mapStylistIdentity(profile) };
  },
  async updateStatus(id: string, status: AppointmentStatus, interval: number) {
    if (!/^[a-f\d]{24}$/i.test(id)) throw new StylistApiError('La cita no es válida.');
    const payload = record(await request(`/appointments/${encodeURIComponent(id)}/status`, 'PATCH', { estado: apiStatuses[status] }));
    const appointment = mapStylistAppointment(payload.appointment, interval);
    if (appointment.id !== id || appointment.status !== status) {
      throw new StylistApiError('El servidor no confirmó el cambio solicitado. Actualiza la cita antes de reintentar.');
    }
    return appointment;
  },
  async saveAvailability(days: WorkDay[], blocks: ScheduleBlock[], interval: number) {
    const errors = validateAvailability(days, blocks, interval);
    if (errors.length) throw new StylistApiError(errors[0]);
    return mapStylistAvailability(await request('/availability', 'PUT', availabilityPayload(days, blocks, interval)));
  },
};
