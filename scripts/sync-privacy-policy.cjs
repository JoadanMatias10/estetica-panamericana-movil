const fs = require('node:fs');
const path = require('node:path');

const serverDirectory = process.argv[2];
if (!serverDirectory) {
  console.error('Uso: node scripts/sync-privacy-policy.cjs <directorio-del-servidor>');
  process.exit(1);
}
const serverRoot = path.resolve(serverDirectory);
if (!fs.existsSync(path.join(serverRoot, 'routes', 'privacyPolicy.js'))) {
  console.error('El directorio debe corresponder al servidor que contiene routes/privacyPolicy.js.');
  process.exit(1);
}
const source = path.join(__dirname, '../src/features/public/data/privacy-policy.json');
const target = path.join(serverRoot, 'data', 'privacy-policy.json');
JSON.parse(fs.readFileSync(source, 'utf8'));
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.copyFileSync(source, target);
console.log('Texto de privacidad sincronizado con el servidor.');
