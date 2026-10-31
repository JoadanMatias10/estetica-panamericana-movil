# Política de privacidad en la app y en la web

La pantalla **Más → Política de privacidad** muestra el texto completo, incluido
en la app y disponible sin conexión. También se accede desde el registro, la
página de información y el perfil del cliente. El botón **Ver página web pública**
abre la versión HTML del servidor. La lectura en la app sigue disponible aunque
falle la conexión o el navegador.

El aviso se preparó a partir de la sección 3 del documento proporcionado
(páginas 4 a 9, hasta el inicio de Términos y Condiciones). Se conservaron sus
finalidades, categorías de datos, derechos y procedimientos, organizados para
lectura en pantalla. La portada escolar, los contratos, las firmas y la documentación
de evaluación no se incorporaron al contenido público. El PDF original no se
copió al servidor ni al repositorio móvil.

Se añadieron las funciones actuales de la app: Google/Firebase, comprobantes en
Cloudinary, correo mediante Brevo, servidor en Render, almacenamiento MongoDB,
datos locales y eliminación de cuentas. La referencia al INAI se actualizó a la
autoridad identificada en la [ley vigente, artículos 2, 38 y 40](https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf).
Los plazos ARCO se contrastaron con el artículo 31 de esa ley. El aviso original
indica 26 de septiembre de 2025; esta adaptación tiene fecha 30 de octubre de 2026.

## Página pública y enlace para Play Console

Los archivos de la web están en el proyecto del servidor existente,
`../Proyecto_Estetica_Panamericana/server`, separado del repositorio móvil.

Después de desplegar el servidor actualizado, el enlace de privacidad será:

[Política de privacidad](https://proyecto-estetica-3dnx.onrender.com/api/public/privacy-policy)

Es una página HTML con el texto completo, sin login, cookies, JavaScript ni visor
PDF. Tiene enlaces internos a cada sección, contacto y acceso al formulario de
eliminación de cuentas. La página de eliminación también enlaza al aviso.
El servidor no consulta la base de datos para mostrar la política.

## Editar y mantener el mismo texto

La fuente del texto está en `src/features/public/data/privacy-policy.json`. La app
la incluye directamente. El servidor utiliza una copia en `server/data/privacy-policy.json`.
Después de editar la fuente, sincronizar la copia del servidor desde este proyecto:

```powershell
node scripts/sync-privacy-policy.cjs ..\Proyecto_Estetica_Panamericana\server
```

Actualizar la fecha del aviso y publicar las nuevas versiones del servidor y la
app al cambiar el texto. No se cambió el PDF ni la carga de documentos de la
administración: la nueva pantalla muestra el aviso de texto incluido en la app.

## Antes de publicarlo

- Se utilizaron el correo y teléfono confirmados por el usuario:
  `esteticapanamericanacitas@gmail.com` y `771 151 5958`, en lugar de los contactos
  contradictorios del PDF. El plazo de respaldos confirmado es **una semana**:
  el aviso establece un máximo de **7 días después de confirmar la eliminación de la cuenta**.
- El responsable debe aplicar ese plazo a sus respaldos y copias exportadas.
  Esta conversión del aviso no modifica ni ejecuta el borrado de esos archivos.
  La eliminación automática ya implementada opera sobre el servicio activo y
  sus proveedores, como se detalla en `ELIMINACION_CUENTA.md`.
- Desplegar el servidor actualizado, generar la nueva app y registrar la URL de
  privacidad en Play Console. Verificar que el enlace sea accesible públicamente.
- Completar Seguridad de los datos de Play Console de acuerdo con las funciones
  y proveedores declarados en el aviso.

El disparador de Android solo genera el AAB descargable. La carga y publicación
en Google Play siguen siendo pasos manuales.
