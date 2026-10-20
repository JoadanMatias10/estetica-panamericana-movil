export type ClientPaymentType = 'Producto' | 'Servicio';

export type ClientPaymentMethod = 'Tarjeta' | 'Transferencia' | 'Pago en sucursal';

export type ClientPaymentStatus =
  | 'Pendiente'
  | 'Procesando'
  | 'Pagado'
  | 'Confirmado'
  | 'Rechazado';

export type ClientPaymentDetail = {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
};

export type ClientPaymentCustomer = {
  email: string;
  name: string;
  phone: string;
};

export type ClientPayment = {
  appointmentId: string;
  concept: string;
  createdAt: string;
  customer: ClientPaymentCustomer;
  date: string;
  details: ClientPaymentDetail[];
  id: string;
  method: ClientPaymentMethod;
  notes: string;
  reviewNotes: string;
  reviewedAt: string | null;
  reviewedBy: string;
  proofUrl: string;
  reference: string;
  saleId: string;
  status: ClientPaymentStatus;
  total: number;
  type: ClientPaymentType;
};

export type ClientPaymentItemInput = {
  itemId: string;
  quantity: number;
};

export type CreateClientPaymentInput = {
  appointmentId?: string;
  items: ClientPaymentItemInput[];
  method: ClientPaymentMethod;
  notes?: string;
  reference?: string;
  type: ClientPaymentType;
};

export type ClientPaymentProof = {
  file?: File;
  mimeType: string;
  name: string;
  uri: string;
};

export type ClientBankTransferConfig = {
  account: string;
  bank: string;
  beneficiary: string;
  clabe: string;
  isDemo: boolean;
  message: string;
};

export type ClientPaymentConfig = {
  bankTransfer: ClientBankTransferConfig;
};

export type CreateClientPaymentResult = {
  message: string;
  payment: ClientPayment;
};
