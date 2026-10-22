export type ClientStylist = {
  email: string;
  id: string;
  name: string;
  phone: string;
  staffId: string;
};

export type ClientWeekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type ClientWeeklyScheduleDay = {
  breakEnd: string;
  breakStart: string;
  day: ClientWeekday;
  enabled: boolean;
  endTime: string;
  startTime: string;
};

export type ClientBlockedPeriod = {
  allDay: boolean;
  endDate: string;
  endTime: string;
  id: string;
  reason: string;
  startDate: string;
  startTime: string;
};

export type ClientStylistAvailability = {
  blockedPeriods: ClientBlockedPeriod[];
  id: string;
  slotMinutes: number;
  stylistId: string;
  weeklySchedule: ClientWeeklyScheduleDay[];
};

export type ClientAvailabilitySlot = string;

export type ClientAvailabilityDay = {
  available: boolean;
  date: string;
  reason: string;
  slots: ClientAvailabilitySlot[];
};

export type ClientStylistAvailabilityQuery = {
  fromDate: string;
  serviceId?: string;
  stylistId: string;
  toDate: string;
};

export type ClientStylistAvailabilityResult = {
  availability: ClientStylistAvailability;
  days: ClientAvailabilityDay[];
  stylist: ClientStylist;
};
