# Estética Panamericana · aplicación móvil

Aplicación móvil en Expo, React Native y TypeScript para los módulos Público (invitado), Cliente y Estilista. El proyecto usa Expo Router, arquitectura cliente-servidor y una adaptación de MVVM para React.

## Alcance actual

- **APP-001:** proyecto Expo SDK 57 configurado, identidad de la aplicación, TypeScript estricto y ESLint.
- **APP-002:** tokens visuales, componentes base y navegación inferior de los tres módulos.
- Las pantallas funcionales, autenticación, sesión, API, almacenamiento, citas y pagos pertenecen a actividades posteriores y todavía no se simulan como terminadas.

## Ejecutar localmente

Requisitos: Node.js 22.13 o posterior y npm.

```bash
npm install
npx expo start
```

Desde el menú **Más** del módulo público existen accesos temporales a Cliente y Estilista para comprobar su navegación local. APP-006 reemplazará esos accesos por la redirección real según la sesión y el rol.

## Navegación base

| Módulo | Ruta inicial | Pestañas |
| --- | --- | --- |
| Público | `/public` | Inicio, Servicios, Productos, Más |
| Cliente | `/client` | Inicio, Citas, Servicios, Productos, Perfil |
| Estilista | `/stylist` | Inicio, Citas, Agenda, Servicios, Horario |

La ruta `/` redirige al módulo público. No se incluyen módulos de Administrador ni Alexa.

## MVVM

```text
src/
├── app/                         # Views de ruta y layouts de Expo Router
├── features/
│   ├── navigation/
│   │   ├── models/              # Contratos y definición de módulos
│   │   ├── view-models/         # Estado/acciones de navegación
│   │   └── views/               # Vistas reutilizables
│   └── public/views/            # Vistas propias del módulo público
└── shared/
    ├── components/              # Botón, tarjeta, tipografía, iconos y pantalla
    ├── navigation/              # Navegador inferior común
    ├── theme/                   # Tokens del sistema visual
    └── types/                   # Tipos compartidos
```

Las rutas se mantienen delgadas: renderizan una View. Las Views consumen ViewModels; los ViewModels coordinan estado y acciones; los Models describen los datos. La capa de servicios para la API REST existente se añadirá en APP-011, sin colocar solicitudes HTTP dentro de las pantallas.

## Validación

```bash
npm run lint
npx tsc --noEmit
npx expo-doctor
```

El proyecto usa Continuous Native Generation; no se deben crear ni editar manualmente las carpetas `ios/` o `android/`.

## Protección de compilaciones de producción

- `metro.config.js` usa `obfuscator-io-metro-plugin` 2.2.1 durante `expo export:embed --dev false`. Ofusca los módulos propios antes de que Android o iOS compilen el bundle con Hermes. Las compilaciones de desarrollo no se ofuscan.
- En el paso `Bundle JavaScript` de EAS debe aparecer `[obfuscation] N módulos propios ofuscados`. La compilación falla si no se ofusca ninguno.
- `expo-build-properties` activa R8 y la reducción de recursos en Android `release` mediante la configuración de Expo, sin mantener archivos nativos generados.
- Android desactiva las copias de seguridad de datos de la app. `expo-image-picker` bloquea los permisos de cámara y micrófono porque la app solo selecciona imágenes de la galería.
- `npx expo export --platform android` genera bytecode Hermes directamente. Ese flujo, incluido en las actualizaciones OTA, no ejecuta el plugin de ofuscación; el plugin se aplica a los binarios nativos de producción.
- Los mapas de código JavaScript generados antes de la ofuscación no representan fielmente el bundle final. Conviene conservar el `mapping.txt` de R8 para analizar fallos nativos de Android.

Para probar con Expo y recarga en desarrollo, genera el perfil `development` con `npx eas-cli@latest build --platform android --profile development` y abre la app instalada con `npx expo start --dev-client`. Para probar la ofuscación y R8 en un dispositivo, genera e instala el APK `preview` con `npx eas-cli@latest build --platform android --profile preview`. El perfil `production` genera el AAB para Google Play: `npx eas-cli@latest build --platform android --profile production`.

Para verificar cada binario, revisa `Bundle JavaScript` y confirma el mensaje `[obfuscation]` con un número mayor que cero; en `Run gradlew` confirma `:app:minifyReleaseWithR8` y `BUILD SUCCESSFUL`. Inspecciona el APK o AAB final para comprobar que incluye bytecode Hermes y no incluye fuentes ni mapas de código. En Android, confirma también `allowBackup=false` y que no se declaran `CAMERA` ni `RECORD_AUDIO`.
