// Replace Jest's zero-hit records for Node-tested modules with the mapped Node coverage.
// Every production file appears exactly once in the LCOV report consumed by SonarQube.
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const jestReport = path.join(root, 'coverage', 'lcov.info');
const nodeReport = path.join(root, 'coverage', 'node', 'lcov.info');

function records(file) {
  const text = fs.readFileSync(file, 'utf8');
  return text.split('end_of_record').map((entry) => entry.trim()).filter(Boolean);
}

function sourceOf(record) {
  const match = record.match(/^SF:(.+)$/m);
  if (!match) throw new Error('El reporte LCOV contiene un registro sin archivo fuente.');
  return match[1].replaceAll('\\', '/');
}

const jestRecords = records(jestReport);
const nodeRecords = records(nodeReport);
const nodeBySource = new Map(nodeRecords.map((record) => [sourceOf(record), record]));
if (nodeBySource.size !== 7 || nodeBySource.size !== nodeRecords.length) {
  throw new Error('La cobertura Node debe contener exactamente siete módulos sin duplicados.');
}

const replaced = new Set();
const merged = jestRecords.map((record) => {
  const source = sourceOf(record);
  const node = nodeBySource.get(source);
  if (!node) return record;
  if (replaced.has(source)) throw new Error(`Archivo duplicado en cobertura Jest: ${source}`);
  replaced.add(source);
  return node;
});
if (replaced.size !== nodeBySource.size) {
  throw new Error('Faltan fuentes Node en la cobertura Jest; se cancela la combinación.');
}

fs.writeFileSync(jestReport, `${merged.join('\nend_of_record\n')}\nend_of_record\n`);
console.log(`LCOV combinado: ${merged.length} fuentes, ${replaced.size} cubiertas por pruebas Node sin duplicados.`);
