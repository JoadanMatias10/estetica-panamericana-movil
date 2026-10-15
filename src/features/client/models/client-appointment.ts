export type ClientAppointmentStatus =
  | 'pendiente'
  | 'confirmada'
  | 'completada'
  | 'cancelada';

export type ClientAppointmentPaymentStatus =
  | 'Sin pago'
  | 'Pendiente'
  | 'Pagado'
  | 'Rechazado';

export type ClientAppointment = {
  createdAt: string;
  dateTime: string;
  durationMinutes: number;
  id: string;
  notes: string;
  paidAt: string | null;
  paymentId: string;
  paymentStatus: ClientAppointmentPaymentStatus;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  status: ClientAppointmentStatus;
  stylistId: string;
  updatedAt: string;
};

export type CreateClientAppointmentInput = {
  date: string;
  notes?: string;
  serviceId?: string;
  serviceName?: string;
  stylistId?: string;
  time: string;
};

export type ReprogramClientAppointmentInput = {
  date: string;
  stylistId?: string;
  time: string;
};

export type ClientAppointmentMutationResult = {
  appointment: ClientAppointment;
  message: string;
};
