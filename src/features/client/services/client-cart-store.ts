import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type {
  AddClientCartItemInput,
  ClientCartItem,
  ClientCartSnapshot,
} from '@/features/client/models/client-cart';

const CART_STORAGE_KEY = 'estetica-panamericana.client-cart.v1';
const CART_STORAGE_VERSION = 1;

type CartListener = () => void;
type UnknownRecord = Record<string, unknown>;

type StoredCart = {
  items: ClientCartItem[];
  version: typeof CART_STORAGE_VERSION;
};

export class ClientCartError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClientCartError';
  }
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function trimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function finiteNumber(value: unknown): number | undefined {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function positiveInteger(value: unknown): number | undefined {
  const parsed = finiteNumber(value);
  if (parsed === undefined) return undefined;
  const integer = Math.floor(parsed);
  return integer > 0 ? integer : undefined;
}

function stockInteger(value: unknown): number | undefined {
  const parsed = finiteNumber(value);
  if (parsed === undefined) return undefined;
  return Math.max(0, Math.floor(parsed));
}

function parseStoredItem(value: unknown): ClientCartItem | undefined {
  if (!isRecord(value)) return undefined;

  const productId = trimmedString(value.productId);
  const name = trimmedString(value.name);
  const unitPrice = finiteNumber(value.unitPrice);
  const stock = stockInteger(value.stock);
  const quantity = positiveInteger(value.quantity);
  if (!productId || !name || unitPrice === undefined || unitPrice < 0 || stock === undefined || !quantity) {
    return undefined;
  }
  if (stock === 0) return undefined;

  const imageUrl = trimmedString(value.imageUrl);
  const presentation = trimmedString(value.presentation);
  return {
    ...(imageUrl ? { imageUrl } : {}),
    name,
    ...(presentation ? { presentation } : {}),
    productId,
    quantity: Math.min(quantity, stock),
    stock,
    unitPrice,
  };
}

function parseStoredCart(value: unknown): ClientCartItem[] | undefined {
  if (!isRecord(value) || value.version !== CART_STORAGE_VERSION || !Array.isArray(value.items)) {
    return undefined;
  }

  const byProductId = new Map<string, ClientCartItem>();
  value.items.forEach((itemValue) => {
    const item = parseStoredItem(itemValue);
    if (!item) return;

    const existing = byProductId.get(item.productId);
    byProductId.set(item.productId, existing
      ? { ...item, quantity: Math.min(existing.quantity + item.quantity, item.stock) }
      : item);
  });
  return Array.from(byProductId.values());
}

function normalizeNewItem(input: AddClientCartItemInput): AddClientCartItemInput {
  const productId = input.productId.trim();
  const name = input.name.trim();
  const unitPrice = finiteNumber(input.unitPrice);
  const stock = stockInteger(input.stock);

  if (!productId) throw new ClientCartError('El producto no tiene un identificador válido.');
  if (!name) throw new ClientCartError('El producto no tiene un nombre válido.');
  if (unitPrice === undefined || unitPrice < 0) {
    throw new ClientCartError('El precio del producto no es válido.');
  }
  if (stock === undefined) throw new ClientCartError('El stock del producto no es válido.');
  if (stock === 0) throw new ClientCartError('Este producto está agotado.');

  const imageUrl = input.imageUrl?.trim();
  const presentation = input.presentation?.trim();
  return {
    ...(imageUrl ? { imageUrl } : {}),
    name,
    ...(presentation ? { presentation } : {}),
    productId,
    stock,
    unitPrice,
  };
}

function createSnapshot(items: readonly ClientCartItem[], isHydrated: boolean): ClientCartSnapshot {
  const safeItems = items.map((item) => Object.freeze({ ...item }));
  const totalQuantity = safeItems.reduce((total, item) => total + item.quantity, 0);
  const subtotal = safeItems.reduce((total, item) => total + item.unitPrice * item.quantity, 0);

  return Object.freeze({
    distinctItemCount: safeItems.length,
    isHydrated,
    items: Object.freeze(safeItems),
    subtotal,
    totalQuantity,
  });
}

const serverSnapshot = createSnapshot([], false);
let snapshot = serverSnapshot;
let revision = 0;
let clearRevision = 0;
let hydrationPromise: Promise<ClientCartSnapshot> | null = null;
const listeners = new Set<CartListener>();

function publish(items: readonly ClientCartItem[], isHydrated = snapshot.isHydrated) {
  revision += 1;
  snapshot = createSnapshot(items, isHydrated);
  listeners.forEach((listener) => listener());
  return snapshot;
}

async function persist(items: readonly ClientCartItem[]) {
  if (Platform.OS === 'web') return;

  try {
    if (!items.length) {
      await SecureStore.deleteItemAsync(CART_STORAGE_KEY);
      return;
    }

    const storedCart: StoredCart = {
      items: items.map((item) => ({ ...item })),
      version: CART_STORAGE_VERSION,
    };
    await SecureStore.setItemAsync(CART_STORAGE_KEY, JSON.stringify(storedCart), {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch {
    // El carrito permanece operativo en memoria si el almacenamiento del dispositivo falla.
  }
}

async function hydrate(): Promise<ClientCartSnapshot> {
  if (snapshot.isHydrated) return snapshot;
  if (hydrationPromise) return hydrationPromise;

  const startingRevision = revision;
  hydrationPromise = (async () => {
    if (Platform.OS === 'web') return publish(snapshot.items, true);

    try {
      const storedValue = await SecureStore.getItemAsync(CART_STORAGE_KEY);
      if (!storedValue) return publish(snapshot.items, true);

      const parsed: unknown = JSON.parse(storedValue);
      const storedItems = parseStoredCart(parsed);
      if (!storedItems) {
        await SecureStore.deleteItemAsync(CART_STORAGE_KEY).catch(() => undefined);
        return publish(snapshot.items, true);
      }

      if (revision !== startingRevision) return publish(snapshot.items, true);
      return publish(storedItems, true);
    } catch {
      return publish(snapshot.items, true);
    }
  })().finally(() => {
    hydrationPromise = null;
  });

  return hydrationPromise;
}

async function add(
  input: AddClientCartItemInput,
  quantity = 1,
): Promise<ClientCartSnapshot> {
  const item = normalizeNewItem(input);
  const amount = positiveInteger(quantity);
  if (!amount) throw new ClientCartError('La cantidad debe ser mayor que cero.');

  const startingClearRevision = clearRevision;
  await hydrate();
  if (clearRevision !== startingClearRevision) {
    throw new ClientCartError('El carrito cambió. Vuelve a agregar el producto.');
  }

  const currentItems = snapshot.items;
  const existingIndex = currentItems.findIndex(({ productId }) => productId === item.productId);
  const nextItems = currentItems.map((currentItem) => ({ ...currentItem }));
  if (existingIndex >= 0) {
    const existing = nextItems[existingIndex];
    nextItems[existingIndex] = {
      ...existing,
      ...item,
      quantity: Math.min(existing.quantity + amount, item.stock),
    };
  } else {
    nextItems.push({ ...item, quantity: Math.min(amount, item.stock) });
  }

  const nextSnapshot = publish(nextItems);
  await persist(nextSnapshot.items);
  return nextSnapshot;
}

async function updateQuantity(productId: string, quantity: number): Promise<ClientCartSnapshot> {
  const id = productId.trim();
  if (!id) throw new ClientCartError('El producto no tiene un identificador válido.');

  const requestedQuantity = Math.floor(finiteNumber(quantity) ?? 0);
  const existing = snapshot.items.find((item) => item.productId === id);
  if (!existing) return snapshot;

  const nextItems = requestedQuantity <= 0
    ? snapshot.items.filter((item) => item.productId !== id)
    : snapshot.items.map((item) => item.productId === id
      ? { ...item, quantity: Math.min(requestedQuantity, item.stock) }
      : { ...item });

  const nextSnapshot = publish(nextItems);
  await persist(nextSnapshot.items);
  return nextSnapshot;
}

async function remove(productId: string): Promise<ClientCartSnapshot> {
  const id = productId.trim();
  if (!id) throw new ClientCartError('El producto no tiene un identificador válido.');
  if (!snapshot.items.some((item) => item.productId === id)) return snapshot;

  const nextSnapshot = publish(snapshot.items.filter((item) => item.productId !== id));
  await persist(nextSnapshot.items);
  return nextSnapshot;
}

async function clear(): Promise<ClientCartSnapshot> {
  clearRevision += 1;
  const nextSnapshot = publish([]);
  await persist([]);
  return nextSnapshot;
}

export const clientCartStore = {
  add,
  clear,
  getServerSnapshot: () => serverSnapshot,
  getSnapshot: () => snapshot,
  hydrate,
  remove,
  subscribe(listener: CartListener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  updateQuantity,
};

export const hydrateClientCart = clientCartStore.hydrate;
export const addClientCartItem = clientCartStore.add;
export const updateClientCartItemQuantity = clientCartStore.updateQuantity;
export const removeClientCartItem = clientCartStore.remove;
export const clearClientCart = clientCartStore.clear;
