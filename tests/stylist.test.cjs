const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

// Execute the production TypeScript without Expo/native modules or real network access.
function loadModules(session, fetchMock) {
  const root = path.resolve(__dirname, '..');
  const cache = new Map();
  function load(file) {
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} };
    cache.set(file, module);
    const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const requireMock = (id) => {
      if (id.endsWith('/public-auth-session')) return { getPublicAuthSession: async () => session };
      if (id === '@/shared/config/api') return { API_BASE_URL: 'https://api.invalid/api' };
      const target = id.startsWith('@/') ? path.join(root, 'src', id.slice(2)) : path.resolve(path.dirname(file), id);
      return load(`${target}.ts`);
    };
    const execute = vm.runInThisContext(`(function(require,module,exports,fetch){${source}\n})`, { filename: file });
    execute(requireMock, module, module.exports, fetchMock || (() => { throw new Error('Unexpected network request'); }));
    return module.exports;
  }
  const feature = (name) => load(path.join(root, 'src/features/stylist', name + '.ts'));
  return { model: feature('models/stylist'), availability: feature('models/availability'), mapper: feature('models/stylist-api-mappers'), api: feature('services/stylist-api-service').stylistApiService };
}

const user = { id: '111111111111111111111111', nombre: 'Estilista de prueba', role: 'stylist' };
const session = { token: 'test-token-not-valid-on-server', user };
const appointment = {
  id: '222222222222222222222222', cliente: 'Cliente de prueba', clienteCorreo: 'test@example.invalid',
  clienteTelefono: '0000000000', servicio: 'Corte', fechaHora: '2026-10-16T10:00:00-06:00',
  estado: 'pendiente', asignada: false, notas: '', updatedAt: '2026-10-15T12:00:00Z',
};
const schedule = {
  slotMinutes: 45,
  weeklySchedule: Array.from({ length: 7 }, (_, day) => ({ day, enabled: day !== 0, startTime: '09:00', endTime: '18:00', breakStart: '13:00', breakEnd: '14:00' })),
  blockedPeriods: [{ id: 'holiday', startDate: '2026-12-24', endDate: '2026-12-26', allDay: true, startTime: '', endTime: '', reason: 'Vacaciones' }],
};
const response = (data, status = 200) => ({ ok: status < 400, status, json: async () => data });
const { model, mapper, availability } = loadModules();

test('maps assigned/unassigned appointments, Spanish statuses, actual or estimated duration', () => {
  const pending = mapper.mapStylistAppointment(appointment, 45);
  assert.equal(pending.status, 'pending');
  assert.equal(pending.assigned, false);
  assert.equal(pending.duration, 45);
  assert.equal(pending.durationEstimated, true);
  const completed = mapper.mapStylistAppointment({ ...appointment, estado: 'completada', asignada: true, duracionMinutos: 90 }, 45);
  assert.equal(completed.status, 'completed');
  assert.equal(completed.assigned, true);
  assert.equal(completed.duration, 90);
  assert.equal(completed.durationEstimated, false);
  assert.equal(mapper.mapStylistAppointment({ ...appointment, estado: 'programada' }, 30).status, 'pending');
  assert.deepEqual(mapper.mapStylistAppointments({ appointments: [] }, 30), []);
});

test('rejects malformed responses instead of displaying fabricated data', () => {
  assert.throws(() => mapper.mapStylistAppointments({}, 30));
  assert.throws(() => mapper.mapStylistAppointment({ ...appointment, fechaHora: 'invalid' }, 30));
  assert.throws(() => mapper.mapStylistAppointment({ ...appointment, estado: 'unknown' }, 30));
  assert.throws(() => mapper.mapStylistAvailability({ availability: { ...schedule, weeklySchedule: [] } }));
  assert.throws(() => mapper.mapStylistIdentity({ user: { ...user, role: 'client' } }));
});

test('preserves multi-day and all-day blocks when saving availability', () => {
  const result = mapper.mapStylistAvailability({ availability: schedule });
  const payload = mapper.availabilityPayload(result.workDays, result.blocks, result.interval);
  assert.equal(result.workDays[0].weekday, 1);
  assert.equal(result.workDays[6].weekday, 0);
  assert.equal(payload.slotMinutes, 45);
  assert.deepEqual(payload.blockedPeriods, schedule.blockedPeriods.map(({ id, ...block }) => block));
  assert.deepEqual(model.validateAvailability(result.workDays, result.blocks, result.interval), []);
});

test('validates invalid dates, breaks, duplicate days and overlapping blocks', () => {
  const { workDays, blocks } = mapper.mapStylistAvailability({ availability: schedule });
  assert.ok(Number.isNaN(model.parseDate('2026-02-30').getTime()));
  assert.equal(model.dateKey(model.parseDate('2028-02-29')), '2028-02-29');
  assert.ok(model.validateAvailability([...workDays.slice(1), workDays[1]], [], 45).length);
  assert.ok(model.validateAvailability(workDays.map((day) => ({ ...day, breakStart: '08:00' })), [], 45).length);
  assert.ok(model.validateAvailability(workDays, [...blocks, { id: 'overlap', date: '2026-12-25', start: '10:00', end: '11:00', reason: '' }], 45).length);
});

test('agenda merges occupied ranges and frees cancelled appointments', () => {
  const { workDays } = mapper.mapStylistAvailability({ availability: schedule });
  const base = { ...mapper.mapStylistAppointment(appointment, 60), date: '2026-10-16', start: '10:00' };
  const appointments = [base, { ...base, id: 'overlap', start: '10:30', duration: 90 }, { ...base, id: 'cancelled', start: '15:00', status: 'cancelled' }];
  const result = availability.dayAgenda(base.date, workDays, [], appointments);
  assert.deepEqual(result.rows.filter((row) => row.kind === 'free').map(({ start, end }) => [start, end]), [[540, 600], [720, 780], [840, 1080]]);
  assert.equal(result.appointments.length, 3);
  const allDay = { id: 'holiday', date: '2026-10-15', endDate: '2026-10-17', allDay: true, start: '00:00', end: '23:59', reason: '' };
  assert.equal(availability.dayAgenda(base.date, workDays, [allDay], appointments).freeCount, 0);
  assert.equal(availability.availabilityConflict(base, workDays, [allDay]), true);
});

test('terminal states cannot change and completion requires confirmation', () => {
  assert.equal(model.canUpdateStatus('pending', 'completed'), false);
  assert.equal(model.canUpdateStatus('pending', 'confirmed'), true);
  assert.equal(model.canUpdateStatus('confirmed', 'completed'), true);
  assert.equal(model.canUpdateStatus('confirmed', 'cancelled'), true);
  assert.equal(model.canUpdateStatus('completed', 'cancelled'), false);
  assert.equal(model.canUpdateStatus('cancelled', 'confirmed'), false);
});

test('week and month filters respect calendar boundaries', () => {
  const base = mapper.mapStylistAppointment(appointment, 45);
  assert.equal(model.inPeriod({ ...base, date: '2026-11-01' }, 'week', new Date(2026, 9, 31)), true);
  assert.equal(model.inPeriod({ ...base, date: '2026-11-02' }, 'week', new Date(2026, 9, 31)), false);
  assert.equal(model.inPeriod({ ...base, date: '2026-11-01' }, 'month', new Date(2026, 9, 31)), false);
});

test('API loads only stylist endpoints and authenticates every request', async () => {
  const calls = [];
  const { api } = loadModules(session, async (url, options) => {
    calls.push({ url, options });
    assert.equal(options.method, 'GET');
    assert.equal(options.headers.Authorization, 'Bearer test-token-not-valid-on-server');
    if (url.endsWith('/me')) return response({ user });
    if (url.endsWith('/availability')) return response({ availability: schedule });
    if (url.endsWith('/appointments')) return response({ appointments: [appointment] });
    throw new Error('Unexpected endpoint');
  });
  const snapshot = await api.getSnapshot();
  assert.equal(calls.length, 3);
  assert.equal(snapshot.identity.name, user.nombre);
  assert.equal(snapshot.appointments.length, 1);
});

test('missing session and non-stylist roles make no network request', async () => {
  for (const invalid of [null, { ...session, user: { ...user, role: 'client' } }]) {
    let count = 0;
    const { api } = loadModules(invalid, async () => { count++; throw new Error('Unexpected request'); });
    await assert.rejects(api.getSnapshot());
    assert.equal(count, 0);
  }
});

test('status mutation uses backend contract and returns the accepted server value', async () => {
  const { api } = loadModules(session, async (url, options) => {
    assert.ok(url.endsWith(`/appointments/${appointment.id}/status`));
    assert.equal(options.method, 'PATCH');
    assert.deepEqual(JSON.parse(options.body), { estado: 'confirmada' });
    return response({ appointment: { ...appointment, estado: 'confirmada', asignada: true } });
  });
  const result = await api.updateStatus(appointment.id, 'confirmed', 45);
  assert.equal(result.status, 'confirmed');
  assert.equal(result.assigned, true);
  await assert.rejects(api.updateStatus('invalid-id', 'confirmed', 45));
});

test('API failure is rejected, never reported as a successful mutation', async () => {
  const { api } = loadModules(session, async () => response({ errors: ['La cita ya no está disponible.'] }, 409));
  await assert.rejects(api.updateStatus(appointment.id, 'confirmed', 45), /ya no está disponible/);
  const disconnected = loadModules(session, async () => { throw new TypeError('Network offline'); });
  await assert.rejects(disconnected.api.getSnapshot(), /conectar/);
});

test('a success HTTP code is not sufficient if the appointment change was not accepted', async () => {
  for (const serverAppointment of [appointment, { ...appointment, id: '333333333333333333333333', estado: 'confirmada' }]) {
    const { api } = loadModules(session, async () => response({ appointment: serverAppointment }));
    await assert.rejects(api.updateStatus(appointment.id, 'confirmed', 45), /no confirmó el cambio/);
  }
});

test('availability PUT preserves data, and validation prevents invalid requests', async () => {
  let count = 0;
  const { api } = loadModules(session, async (url, options) => {
    count++;
    assert.ok(url.endsWith('/availability'));
    assert.equal(options.method, 'PUT');
    const body = JSON.parse(options.body);
    assert.equal(body.blockedPeriods[0].endDate, '2026-12-26');
    assert.equal(body.blockedPeriods[0].allDay, true);
    return response({ availability: { ...body, blockedPeriods: schedule.blockedPeriods } });
  });
  const { workDays, blocks, interval } = mapper.mapStylistAvailability({ availability: schedule });
  const saved = await api.saveAvailability(workDays, blocks, interval);
  assert.equal(saved.blocks[0].endDate, '2026-12-26');
  await assert.rejects(api.saveAvailability([], blocks, interval));
  assert.equal(count, 1);
});
