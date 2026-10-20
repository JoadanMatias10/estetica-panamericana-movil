// Run the existing Node tests with coverage mapped back to their TypeScript sources.
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { createInstrumenter } = require('istanbul-lib-instrument');
const { createCoverageMap } = require('istanbul-lib-coverage');
const { createSourceMapStore } = require('istanbul-lib-source-maps');
const { createContext } = require('istanbul-lib-report');
const reports = require('istanbul-reports');

const root = path.resolve(__dirname, '..');
const sourcePaths = [
  'src/features/client/services/client-cart-store.ts',
  'src/features/client/services/client-session-service.ts',
  'src/features/client/view-models/use-client-product-checkout-view-model.ts',
  'src/features/stylist/models/availability.ts',
  'src/features/stylist/models/stylist-api-mappers.ts',
  'src/features/stylist/models/stylist.ts',
  'src/features/stylist/services/stylist-api-service.ts',
];

const digest = (source) => crypto.createHash('sha256').update(source).digest('hex');
const byDigest = new Map(sourcePaths.map((relativePath) => {
  const file = path.join(root, relativePath);
  return [digest(fs.readFileSync(file, 'utf8')), file];
}));
if (byDigest.size !== sourcePaths.length) throw new Error('Fuentes TypeScript duplicadas en el reporte Node.');

const sourceMaps = createSourceMapStore();
const instrumenter = createInstrumenter({
  coverageVariable: '__nodeTestsCoverage__',
  produceSourceMap: true,
  compact: false,
});

// Both existing suites call ts.transpileModule synchronously. The wrapper is
// limited to this process and does not change either test or application code.
const instrumentedTypeScript = Object.create(ts);
Object.defineProperty(instrumentedTypeScript, 'transpileModule', {
  value(source, options) {
    const file = byDigest.get(digest(source));
    if (!file) throw new Error('Una prueba Node cargó un módulo TypeScript sin cobertura configurada.');
    const transformed = ts.transpileModule(source, {
      ...options,
      fileName: file,
      compilerOptions: { ...options.compilerOptions, sourceMap: true },
    });
    const sourceMap = JSON.parse(transformed.sourceMapText);
    sourceMaps.registerMap(file, sourceMap);
    return {
      ...transformed,
      outputText: instrumenter.instrumentSync(transformed.outputText, file, sourceMap),
    };
  },
});
require.cache[require.resolve('typescript')].exports = instrumentedTypeScript;

require('./client-cart.test.cjs');
require('./stylist.test.cjs');

let reportWritten = false;
process.on('beforeExit', async () => {
  if (reportWritten) return;
  reportWritten = true;
  const raw = createCoverageMap(globalThis.__nodeTestsCoverage__);
  const mapped = await sourceMaps.transformCoverage(raw);
  const coveredPaths = mapped.files().map((file) => path.relative(root, file).replaceAll('\\', '/'));
  if (coveredPaths.length !== sourcePaths.length ||
      !sourcePaths.every((file) => coveredPaths.includes(file))) {
    throw new Error('El reporte Node no contiene todas las fuentes TypeScript esperadas.');
  }
  const context = createContext({ dir: path.join(root, 'coverage', 'node'), coverageMap: mapped });
  reports.create('lcovonly', { file: 'lcov.info' }).execute(context);
  console.log(`LCOV Node generado para ${coveredPaths.length} módulos TypeScript.`);
});
