const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

function loadAuth(platform = 'android', mobileUrl = 'esteticapanamericana://public/reset-password') {
  const requests = [];
  const module = { exports: {} };
  const file = path.resolve(__dirname, '../src/features/public/auth/services/public-auth-service.ts');
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const execute = vm.runInNewContext(`(function(require,module,exports){${source}\n})`, {
    AbortController, setTimeout, clearTimeout,
    fetch: async (url, options) => {
      requests.push({ url, body: JSON.parse(options.body || '{}') });
      return { ok: true, json: async () => ({ message: 'ok' }) };
    },
  });
  execute((id) => {
    if (id === 'expo-linking') return { createURL: (route) => {
      assert.equal(route, 'public/reset-password');
      return mobileUrl;
    } };
    if (id === 'react-native') return { Platform: { OS: platform } };
    return { PUBLIC_API_BASE_URL: 'https://api.example.com/api' };
  }, module, module.exports);
  return { service: module.exports.publicAuthService, requests };
}

test('la app instalada recupera y cambia la contrasena con la API desplegada', async () => {
  const { service, requests } = loadAuth();
  await service.recoverPassword('prueba@example.com');
  await service.validateResetToken('token+prueba');
  await service.resetPassword('token+prueba', 'Nueva123!');
  await service.login({ correo: 'prueba@example.com', password: 'Anterior123!' });
  await service.register({ correo: 'prueba@example.com' });
  assert.deepEqual(Array.from(requests, (request) => request.url), [
    'https://api.example.com/api/public/recover',
    'https://api.example.com/api/public/reset-password/validate?token=token%2Bprueba',
    'https://api.example.com/api/public/reset-password',
    'https://api.example.com/api/public/login',
    'https://api.example.com/api/public/register',
  ]);
  assert.equal(requests[0].body.origen, 'movil');
  assert.equal(requests[0].body.mobileResetUrl, 'esteticapanamericana://public/reset-password');
});

test('Expo Go envia su enlace con /--/ para regresar a la pantalla movil', async () => {
  const destination = 'exp://25.25.25.109:8081/--/public/reset-password';
  const { service, requests } = loadAuth('android', destination);
  await service.recoverPassword('prueba@example.com');
  assert.equal(requests[0].url, 'https://api.example.com/api/public/recover');
  assert.equal(requests[0].body.mobileResetUrl, destination);
});

test('la web solicita un correo web sin enlace de retorno a la app', async () => {
  const { service, requests } = loadAuth('web');
  await service.recoverPassword('prueba@example.com');
  assert.equal(requests[0].body.origen, 'web');
  assert.equal(requests[0].body.mobileResetUrl, undefined);
});
