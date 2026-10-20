const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const product = { productId: 'product-a', name: 'Shampoo', unitPrice: 100, stock: 5 };
const storedCart = (items) => JSON.stringify({ version: 1, items });

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((accept, fail) => { resolve = accept; reject = fail; });
  return { promise, resolve, reject };
}

// Carga los módulos de producción utilizando almacenamiento en memoria y sin acceso a la red.
function loadTypeScript(relativePath, mocks) {
  const file = path.join(root, relativePath);
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  const requireMock = (id) => {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    throw new Error(`Unexpected module: ${id}`);
  };
  const execute = vm.runInThisContext(`(function(require,module,exports){${source}\n})`, { filename: file });
  execute(requireMock, module, module.exports);
  return module.exports;
}

function loadCart(initialValue = null, read, platform = 'android') {
  let stored = initialValue;
  const writes = [];
  const storage = {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'device-only',
    getItemAsync: read || (async () => stored),
    setItemAsync: async (_key, value) => { writes.push(value); stored = value; },
    deleteItemAsync: async () => { writes.push(null); stored = null; },
  };
  const { clientCartStore: cart } = loadTypeScript('src/features/client/services/client-cart-store.ts', {
    'expo-secure-store': storage,
    'react-native': { Platform: { OS: platform } },
  });
  return { cart, writes, stored: () => stored };
}

test('adding while device storage loads preserves the existing cart', async () => {
  const read = deferred();
  const previous = { ...product, quantity: 2 };
  const { cart, writes, stored } = loadCart(null, () => read.promise);
  const adding = cart.add({ ...product, productId: 'product-b', name: 'Crema', unitPrice: 50 }, 1);
  assert.equal(writes.length, 0);
  read.resolve(storedCart([previous]));
  await adding;
  assert.equal(cart.getSnapshot().isHydrated, true);
  assert.deepEqual(cart.getSnapshot().items.map(({ productId, quantity }) => [productId, quantity]), [
    ['product-a', 2], ['product-b', 1],
  ]);
  assert.equal(cart.getSnapshot().subtotal, 250);
  assert.equal(JSON.parse(stored()).items.length, 2);
});

test('quantities respect stock and removing the last item clears storage', async () => {
  const { cart, stored } = loadCart();
  await cart.add(product, 3);
  await cart.add(product, 4);
  assert.equal(cart.getSnapshot().totalQuantity, 5);
  await cart.updateQuantity(product.productId, 99);
  assert.equal(cart.getSnapshot().totalQuantity, 5);
  await cart.updateQuantity(product.productId, 0);
  assert.equal(cart.getSnapshot().items.length, 0);
  assert.equal(stored(), null);
  await assert.rejects(cart.add({ ...product, stock: 0 }), /agotado/);
});

test('clearing during hydration prevents restoring the previous session cart', async () => {
  const read = deferred();
  const { cart, stored } = loadCart(null, () => read.promise);
  const hydration = cart.hydrate();
  await cart.clear();
  read.resolve(storedCart([{ ...product, quantity: 2 }]));
  await hydration;
  assert.equal(cart.getSnapshot().items.length, 0);
  assert.equal(stored(), null);
});

test('an add waiting for hydration is cancelled if the session clears the cart', async () => {
  const read = deferred();
  const { cart, stored } = loadCart(null, () => read.promise);
  const adding = cart.add(product);
  const rejected = assert.rejects(adding, /carrito cambió/);
  await cart.clear();
  read.resolve(storedCart([{ ...product, quantity: 2 }]));
  await rejected;
  assert.equal(cart.getSnapshot().items.length, 0);
  assert.equal(stored(), null);
});

test('switching client accounts removes the previous client cart', async () => {
  const { cart, stored } = loadCart();
  await cart.add(product);
  let savedSession;
  const sessionService = loadTypeScript('src/features/client/services/client-session-service.ts', {
    '@/features/client/services/client-cart-store': { clientCartStore: cart },
    '@/features/public/auth/services/google-auth-service': { clearGoogleAuthSession: async () => {} },
    '@/features/public/auth/services/public-auth-session': {
      getPublicAuthSession: async () => ({ user: { id: 'previous-client' } }),
      savePublicAuthSession: async (session) => { savedSession = session; },
      clearPublicAuthSession: async () => {},
    },
  });
  const nextSession = { token: 'local-test-only', user: { id: 'next-client', role: 'client' } };
  await sessionService.adoptClientSession(nextSession);
  assert.equal(cart.getSnapshot().items.length, 0);
  assert.equal(stored(), null);
  assert.equal(savedSession, nextSession);
});

function loadCheckout(createPayment, clear) {
  const { useClientProductCheckoutViewModel } = loadTypeScript(
    'src/features/client/view-models/use-client-product-checkout-view-model.ts', {
      react: {
        useCallback: (callback) => callback,
        useEffect: () => {},
        useRef: (current) => ({ current }),
        useState: (value) => [value, () => {}],
      },
      '@/features/client/components/client-appointment-helpers': {
        getClientErrorMessage: (error) => error.message,
      },
      '@/features/client/services/client-api-service': { clientApiService: { createPayment } },
      '@/features/client/services/client-cart-store': { clientCartStore: { clear } },
      '@/features/client/services/client-payment-proof-picker': { pickClientPaymentProof: async () => null },
      '@/features/client/view-models/use-client-cart-view-model': {
        useClientCartViewModel: () => ({ cart: { items: [{ ...product, quantity: 2 }] } }),
      },
    },
  );
  return useClientProductCheckoutViewModel();
}

test('two checkout presses before a render submit only one order', async () => {
  const request = deferred();
  const calls = [];
  let clears = 0;
  const checkout = loadCheckout((payload) => { calls.push(payload); return request.promise; }, async () => { clears++; });
  const first = checkout.submit();
  assert.equal(await checkout.submit(), null);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].items, [{ itemId: product.productId, quantity: 2 }]);
  const result = { payment: { id: 'local-payment' } };
  request.resolve(result);
  assert.equal(await first, result);
  assert.equal(clears, 1);
});

test('failed checkout preserves the cart and allows a retry', async () => {
  let attempts = 0;
  let clears = 0;
  const checkout = loadCheckout(async () => {
    attempts++;
    if (attempts === 1) throw new Error('Sin conexión');
    return { payment: { id: 'local-payment' } };
  }, async () => { clears++; });
  assert.equal(await checkout.submit(), null);
  assert.equal(clears, 0);
  assert.equal((await checkout.submit()).payment.id, 'local-payment');
  assert.equal(attempts, 2);
  assert.equal(clears, 1);
});

test('restores duplicate stored products, clamps quantities and drops malformed entries', async () => {
  const saved = storedCart([
    { ...product, productId: ' product-a ', name: ' Shampoo ', quantity: 3 },
    { ...product, quantity: 4 },
    { ...product, productId: '', quantity: 1 },
    { ...product, productId: 'empty', stock: 0, quantity: 1 },
  ]);
  const { cart } = loadCart(saved);
  const hydrated = await cart.hydrate();
  assert.equal(hydrated.distinctItemCount, 1);
  assert.equal(hydrated.totalQuantity, 5);
  assert.equal(hydrated.items[0].name, 'Shampoo');
  assert.equal(hydrated.subtotal, 500);
});

test('invalid stored schema is discarded and the cart remains usable', async () => {
  const { cart, writes } = loadCart(JSON.stringify({ version: 2, items: [product] }));
  assert.equal((await cart.hydrate()).items.length, 0);
  assert.deepEqual(writes, [null]);
  await cart.add(product);
  assert.equal(cart.getSnapshot().totalQuantity, 1);
});

test('malformed storage JSON does not prevent using the in-memory cart', async () => {
  const { cart } = loadCart('{invalid-json');
  assert.equal((await cart.hydrate()).isHydrated, true);
  assert.equal((await cart.add(product)).totalQuantity, 1);
});

test('concurrent hydration shares the same read and preserves immutable snapshots', async () => {
  const read = deferred();
  let reads = 0;
  const { cart } = loadCart(null, () => { reads++; return read.promise; });
  const first = cart.hydrate();
  const second = cart.hydrate();
  assert.equal(reads, 1);
  read.resolve(storedCart([{ ...product, quantity: 2 }]));
  assert.equal((await first).totalQuantity, 2);
  assert.equal((await second).totalQuantity, 2);
  assert.equal(Object.isFrozen(cart.getSnapshot()), true);
  assert.equal(Object.isFrozen(cart.getSnapshot().items[0]), true);
});

test('web cart hydrates and updates without accessing secure storage', async () => {
  const { cart, writes } = loadCart(null, async () => { throw new Error('storage must not be read'); }, 'web');
  assert.equal((await cart.hydrate()).isHydrated, true);
  await cart.add(product, 2);
  assert.equal(cart.getSnapshot().subtotal, 200);
  await cart.clear();
  assert.equal(cart.getSnapshot().totalQuantity, 0);
  assert.equal(writes.length, 0);
});

test('rejects invalid products and quantities without changing the cart', async () => {
  const { cart } = loadCart();
  await assert.rejects(cart.add({ ...product, productId: ' ' }), /identificador/);
  await assert.rejects(cart.add({ ...product, name: ' ' }), /nombre/);
  await assert.rejects(cart.add({ ...product, unitPrice: -1 }), /precio/);
  await assert.rejects(cart.add({ ...product, stock: Number.NaN }), /stock/);
  await assert.rejects(cart.add(product, 0), /cantidad/);
  assert.equal(cart.getSnapshot().items.length, 0);
});

test('reports changes to subscribers and stops after unsubscribe', async () => {
  const { cart } = loadCart();
  let notifications = 0;
  const unsubscribe = cart.subscribe(() => { notifications++; });
  await cart.add(product);
  assert.ok(notifications >= 1);
  const previous = notifications;
  unsubscribe();
  await cart.updateQuantity(product.productId, 3);
  assert.equal(cart.getSnapshot().totalQuantity, 3);
  assert.equal(notifications, previous);
});

test('unknown and blank product identifiers do not remove another item', async () => {
  const { cart } = loadCart();
  await cart.add(product);
  const before = cart.getSnapshot();
  assert.equal(await cart.remove('absent'), before);
  assert.equal(await cart.updateQuantity('absent', 2), before);
  await assert.rejects(cart.remove(' '), /identificador/);
  await assert.rejects(cart.updateQuantity(' ', 2), /identificador/);
  assert.equal(cart.getSnapshot().totalQuantity, 1);
});
