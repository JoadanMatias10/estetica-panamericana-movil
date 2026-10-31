const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Expo's native build uses export:embed to produce JS, then compiles it with
// Hermes. Obfuscate during Metro serialization: the plugin's beforeExit hook
// races with Expo's forced shutdown and runs too late for Hermes bytecode.
const devFlag = process.argv.indexOf('--dev');
const isReleaseBundle =
  process.argv.includes('--dev=false') || (devFlag >= 0 && process.argv[devFlag + 1] === 'false');

if (process.argv.includes('export:embed') && isReleaseBundle) {
  const pluginRequire = createRequire(require.resolve('obfuscator-io-metro-plugin'));
  const JavaScriptObfuscator = pluginRequire('javascript-obfuscator');
  const { wrapCodeWithTags } = pluginRequire('./utils');
  const { buildSafeConfig } = pluginRequire('./javascriptObfuscatorAPI');
  const { BEG_ANNOTATION, END_ANNOTATION, EXTS } = pluginRequire('./constants');
  const expoFilter = config.serializer.processModuleFilter;
  const expoSerializer = config.serializer.customSerializer;
  let obfuscatedModules = 0;

  const options = {
    compact: true,
    sourceMap: false,
    controlFlowFlattening: false,
    deadCodeInjection: false,
    renameGlobals: false,
    stringArray: true,
    stringArrayEncoding: ['base64'],
    stringArrayThreshold: 0.75,
    stringArrayShuffle: true,
  };

  config.serializer.processModuleFilter = (module) => {
    if (expoFilter && !expoFilter(module)) return false;

    if (
      typeof module.path !== 'string' ||
      module.path.includes('node_modules') ||
      !fs.existsSync(module.path) ||
      !path.extname(module.path).match(EXTS)
    ) {
      return true;
    }

    for (const { data } of module.output) {
      if (typeof data?.code !== 'string') continue;

      const { reservedNames } = wrapCodeWithTags(data);
      const start = data.code.indexOf(BEG_ANNOTATION);
      const end = data.code.indexOf(END_ANNOTATION, start);
      if (start < 0 || end < start) {
        throw new Error(`No se pudo ofuscar el módulo: ${module.path}`);
      }
      const originalCode = data.code.slice(start + BEG_ANNOTATION.length, end);
      const safeOptions = buildSafeConfig(options, { reservedNames });
      const obfuscatedCode = JavaScriptObfuscator.obfuscate(originalCode, safeOptions)
        .getObfuscatedCode();

      data.code = data.code.slice(0, start) + obfuscatedCode + data.code.slice(end + END_ANNOTATION.length);
      obfuscatedModules += 1;
    }

    return true;
  };

  config.serializer.customSerializer = async (...args) => {
    const bundle = await expoSerializer(...args);
    if (obfuscatedModules === 0) {
      throw new Error('El bundle de producción no ofuscó ningún módulo propio.');
    }
    console.log(`[obfuscation] ${obfuscatedModules} módulos propios ofuscados en el bundle de producción.`);
    return bundle;
  };
}

module.exports = config;
