# Eliminación de cuentas de clientes

La app incluye **Mi perfil → Eliminar cuenta**. El cliente recibe un código de
8 dígitos en el correo de su cuenta, lo escribe y acepta la confirmación antes de
pulsar **Eliminar mi cuenta permanentemente**. Pedir un código o cancelar la
pantalla no elimina la cuenta ni cierra la sesión.

El código vence en 15 minutos, permite como máximo 5 intentos y solo sirve una
vez. Se almacena como HMAC en el servidor y nunca se guarda en el dispositivo ni
en registros. Cambiar el correo del formulario descarta el código introducido.

## Servidor y página pública

Los cambios correspondientes están en el proyecto existente:
`../Proyecto_Estetica_Panamericana/server`.

- `GET /api/public/account-deletion`: página pública sin inicio de sesión.
- `POST /api/public/account-deletion/request`: solicita un código por correo.
- `POST /api/public/account-deletion/confirm`: verifica el código y confirma la eliminación.

La página web utiliza el mismo flujo y no necesita instalar la app ni publicar
otro sitio. Después de desplegar el servidor, la URL para **Eliminación de cuenta**
en Play Console será:

`https://proyecto-estetica-3dnx.onrender.com/api/public/account-deletion`

Reutiliza Brevo, Firebase Admin, Cloudinary y MongoDB ya configurados. MongoDB
debe admitir transacciones (por ejemplo, Atlas o un replica set). No hay nuevas
dependencias ni cambios en las carpetas nativas.

## Qué ocurre al confirmar

1. Una transacción desactiva el acceso y crea el trabajo de eliminación duradero.
2. La app borra la sesión, el carrito y la foto de perfil guardada localmente si
   corresponden al cliente que confirmó la eliminación.
3. El servidor elimina la identidad de Firebase de esta app y los comprobantes
   de Cloudinary. No elimina la cuenta personal de Google.
4. Otra transacción elimina el usuario, sus citas, notificaciones, pagos,
   tokens de recuperación y códigos de Alexa. Conserva los totales de ventas
   vinculadas sin nombre del cliente ni referencia al pago eliminado. No cambia
   el catálogo, el personal, los totales ni el inventario.
5. Si un proveedor falla, el cliente permanece sin acceso y el servidor reintenta
   automáticamente. La cola sobrevive a reinicios y no vence mientras esté
   pendiente. Por eso la interfaz dice **eliminación confirmada / en proceso**,
   sin prometer que todos los proveedores terminaron al recibir la respuesta.

## Antes de publicarlo

- Desplegar el servidor actualizado y después generar la nueva app. Una versión
  anterior del servidor no contiene estos endpoints.
- Probar con una cuenta desechable creada para esta prueba: cancelar, pedir
  código, introducir uno incorrecto y finalmente confirmar. Verificar que no
  puede iniciar sesión y que el trabajo desaparece al terminar la limpieza.
- Los cambios se verificaron con datos ficticios; no se borraron cuentas reales.
- Definir en la política de privacidad el plazo de conservación de respaldos y
  aplicar las eliminaciones antes de restaurar uno. Este flujo elimina datos del
  servicio activo; no modifica archivos de respaldo exportados anteriormente ni
  registros manuales sin relación con una cuenta. Esos archivos requieren el
  procedimiento de conservación y eliminación del negocio.
