# Recuperacion en web y movil

La app usa la API desplegada de Render, incluida la recuperacion de contrasena.
Una solicitud web conserva el formulario web existente.

La app envia `origen: movil` y el enlace a su pantalla `public/reset-password`,
creado con `expo-linking`: el esquema de la app instalada o `exp://host/--/...`
en Expo Go. El servidor genera un boton HTTPS firmado para que el seguimiento
de Brevo no tenga que redirigir directamente a un esquema de aplicacion.
Ese boton abre la app; no muestra el formulario web ni enlaces web alternativos.
Si el navegador bloquea la apertura automatica, aparece el boton "Abrir aplicacion".

Para probar en Expo Go, el telefono y la PC deben estar en la misma red y Metro
debe estar iniciado con `npx expo start --go`. El callback de desarrollo registrado
en el servidor es `25.25.25.109:8081`. Si cambia la red, se registra el nuevo
`host:puerto` en `MOBILE_PASSWORD_RESET_EXPO_HOSTS` del servidor; no se aceptan
destinos arbitrarios. La app instalada no depende de la IP ni de Metro.

Los correos anteriores conservan sus enlaces originales: solicita uno nuevo
despues del despliegue del backend. Los enlaces vencen en dos horas y el token
solo se consume al guardar la nueva contrasena desde la pantalla correspondiente.
