export type ClientReminderAdvance =
  | '24 horas antes'
  | '12 horas antes'
  | '2 horas antes';

export type ClientNotificationChannel =
  | 'Email'
  | 'WhatsApp'
  | 'Notificacion interna';

export type ClientReminderSettings = {
  advance: ClientReminderAdvance;
  channel: ClientNotificationChannel;
};

export type ClientNotificationPreferences = {
  appointmentChanges: boolean;
  appointmentReminders: boolean;
  promotions: boolean;
};

export type ClientNotificationSettings = {
  preferences: ClientNotificationPreferences;
  reminder: ClientReminderSettings;
};

export type ClientNotificationStatus =
  | 'preparada'
  | 'enviada'
  | 'lista_whatsapp'
  | 'fallida'
  | 'cancelada';

export type ClientNotificationOrigin = 'manual' | 'automatico';

export type ClientNotification = {
  advance: string;
  appointmentId: string;
  channel: ClientNotificationChannel;
  createdAt: string;
  destination: string;
  errorMessage: string;
  id: string;
  message: string;
  origin: ClientNotificationOrigin;
  sentAt: string | null;
  status: ClientNotificationStatus;
  targetDate: string | null;
  type: string;
  whatsappUrl: string;
};

export type PrepareClientNotificationInput = {
  appointmentId: string;
  message: string;
};

export type PrepareClientNotificationResult = {
  message: string;
  notification: ClientNotification;
};

export type UpdateClientReminderResult = {
  message: string;
  reminder: ClientReminderSettings;
};

export type UpdateClientNotificationPreferencesResult = {
  message: string;
  preferences: ClientNotificationPreferences;
};
