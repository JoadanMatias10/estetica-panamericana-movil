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

## Generar una versión desde GitHub

El flujo `.github/workflows/android-release.yml` se dispara al subir una etiqueta
como `v1.0.0`. Comprueba que coincida con `expo.version` en `app.json`, ejecuta
lint, TypeScript y las pruebas, y genera un **AAB de Android** con EAS. El archivo
queda en **Actions → Generar Android para Google Play → Artifacts**, disponible
durante 30 días, con un enlace de descarga en el resumen de la ejecución.

La versión visible inicial sigue siendo **1.0.0**. El perfil `production` usa
`autoIncrement: true` y las versiones remotas de EAS para incrementar únicamente
el número interno de compilación. Si ya hubo compilaciones, continúa desde el
número remoto existente.

Configuración inicial, una sola vez:

1. Crear un [token de acceso de Expo](https://docs.expo.dev/accounts/programmatic-access/)
   con acceso al proyecto y guardarlo en el repositorio en **Settings → Secrets
   and variables → Actions → New repository secret**, con el nombre `EXPO_TOKEN`.
   No se escribe el token en los archivos del proyecto.
2. Tener las credenciales de firma de Android guardadas en EAS. Si faltan,
   configurarlas interactivamente con `npx eas-cli@latest credentials --platform android`,
   seleccionando el perfil `production`.
3. Si se necesitan variables de entorno distintas a las predeterminadas de la
   app, configurarlas en el entorno **production** de EAS. El `.env` local no
   se sube al repositorio.

Después de guardar y subir los cambios que deben formar parte de la versión,
incluido este flujo, verificar que estén integrados en `main` y crear la
etiqueta sobre ese commit, aunque la rama local activa sea otra:

```bash
git fetch origin main
git tag v1.0.0 origin/main
git push origin v1.0.0
```

Para una versión posterior, actualizar `expo.version` y subir su etiqueta,
por ejemplo `v1.0.1`. Si una ejecución falla, corregir la causa y usar
**Re-run jobs** en GitHub; el número interno de una nueva compilación no se repite.

Este flujo solo genera el archivo descargable. **Antes de publicar la app, la
política de privacidad debe estar publicada y sus datos confirmados.** El texto
para la app y la página pública están preparados; ver [PRIVACIDAD.md](PRIVACIDAD.md).
La subida a Play Console y la publicación son pasos manuales. Un AAB se carga en Play
Console; para instalar directamente en un teléfono se usa el APK del perfil `preview`.
