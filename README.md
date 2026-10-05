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
