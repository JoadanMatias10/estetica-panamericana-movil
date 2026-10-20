export type AddClientCartItemInput = {
  imageUrl?: string;
  name: string;
  presentation?: string;
  productId: string;
  stock: number;
  unitPrice: number;
};

export type ClientCartItem = AddClientCartItemInput & {
  quantity: number;
};

export type ClientCartSnapshot = {
  distinctItemCount: number;
  isHydrated: boolean;
  items: readonly ClientCartItem[];
  subtotal: number;
  totalQuantity: number;
};
