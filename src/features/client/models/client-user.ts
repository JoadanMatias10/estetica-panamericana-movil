export type ClientAccountStatus = 'active' | 'inactive' | 'pending';

export type ClientUser = {
  accountStatus?: ClientAccountStatus;
  email: string;
  firstName: string;
  googleLinked: boolean;
  id: string;
  maternalLastName: string;
  missingProfileFields: string[];
  paternalLastName: string;
  phone: string;
  profileComplete: boolean;
  role: 'client';
};

export type UpdateClientProfileInput = {
  email: string;
  firstName: string;
  maternalLastName: string;
  paternalLastName: string;
  phone: string;
};

export type UpdateClientProfileResult = {
  message: string;
  user: ClientUser;
};

export type LinkClientGoogleResult = UpdateClientProfileResult & {
  token: string;
};

export type ClientProfileFormErrors = Partial<Record<keyof UpdateClientProfileInput, string>>;
