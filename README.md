## Migraciones TypeOrm

```bash
npm run migration:create -- NombreMigracion
npm run migration:generate -- NombreMigracion
npm run migration:show
npm run migration:run
npm run migration:revert
```

## Almacenamiento de imágenes de productos

`IMAGE_STORAGE_PROVIDER` selecciona `cloudinary` (predeterminado) o `local`. Para Cloudinary configura `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET`; las credenciales se validan al subir o eliminar una imagen. No publiques el secreto.

Para almacenamiento local configura `IMAGE_LOCAL_DIR` (por defecto `./uploads/products`) y `IMAGE_LOCAL_BASE_URL` con la URL pública que apunta a `/uploads/products`. El proceso necesita permisos de escritura; usa un volumen persistente compartido entre instancias y asegúrate de que el proxy exponga esa ruta. Cambiar de proveedor no migra las imágenes existentes.

## Autenticación y usuarios

Inicia la API y abre Swagger en `http://localhost:3000/docs` (ajusta el puerto si cambiaste `PORT`). Para crear el primer usuario, abre **Autenticación y usuarios → POST /api/v1/auth/register**, pulsa **Try it out**, introduce nombre, correo y una contraseña de 8 a 128 caracteres, y ejecuta la solicitud.

Luego utiliza **POST /api/v1/auth/login** con el mismo correo y contraseña. Para probar **GET /api/v1/auth/me**, copia el `accessToken` de la respuesta y colócalo en **Authorize**. El registro es público y devuelve los datos del usuario sin contraseña.

### Listado de usuarios

Inicia sesión con una cuenta de rol `ADMIN` y abre **Administración → Usuarios** en el frontend (`/admin/usuarios`). Las cuentas registradas públicamente no reciben permisos de administrador.

El listado usa `GET /api/v1/users` con el token Bearer. Puedes probarlo desde Swagger, por ejemplo con `page=1&limit=10&search=ana&role=CLIENTE&emailVerified=false`. Los filtros son opcionales y la API pagina los resultados ya filtrados. Cada fila incluye el correo, rol, verificación y los datos de contacto básicos de la persona; no incluye documento, fecha de nacimiento ni domicilio.

Con PostgreSQL de pruebas configurado y las migraciones aplicadas, ejecuta `npm run test:e2e -- test/users-list.e2e-spec.ts` para comprobar el endpoint.

## Verificación de correo con Resend

1. Crea una cuenta en Resend y verifica un dominio de envío mediante los registros DNS indicados por Resend. Para las restricciones del dominio de prueba, consulta la documentación de Resend.
2. Crea una API key y configura en `.env` `RESEND_API_KEY` y `MAIL_FROM`, por ejemplo `MAIL_FROM=Restaurante <cuentas@tudominio.com>`. No compartas ni subas la clave al repositorio.
3. Configura `APP_URL` con la URL pública del frontend (por defecto `http://localhost:4200`). Reinicia la API y registra un usuario o solicita el reenvío después de iniciar sesión.

Si ambas variables de Resend están ausentes fuera de producción, se usa un transporte de desarrollo que escribe el enlace en los logs de nivel debug. Si falta solo una variable, o faltan ambas en producción, la API no inicia. El registro puede completarse si falla el envío; el usuario puede solicitar un nuevo enlace después de iniciar sesión.

Los enlaces vencen después de 24 horas. Sus tokens se guardan actualmente en memoria, se pierden al reiniciar y no se comparten entre instancias; producción requiere un `EmailTokenStore` persistente compartido.

## Recuperación de contraseña

En la pantalla de inicio de sesión, selecciona «¿Olvidaste tu contraseña?» y solicita un enlace. La respuesta es la misma exista o no la cuenta. El enlace vence en una hora y solo se puede usar una vez. Al completar el cambio se puede iniciar sesión con la nueva contraseña.

El envío utiliza la configuración de Resend y `APP_URL` descrita arriba; en desarrollo sin credenciales, el enlace aparece en los logs de nivel debug. Los tokens de recuperación se guardan en memoria: se pierden al reiniciar y no se comparten entre instancias. En producción se necesita un `EmailTokenStore` persistente compartido. Los JWT ya emitidos pueden seguir siendo válidos hasta su vencimiento (una hora). Configura también límites de solicitudes en el despliegue para evitar abuso.

## Inicio de sesión con Google

Crea un cliente OAuth de tipo aplicación web en Google Cloud y registra exactamente `http://localhost:3000/api/v1/auth/oidc/google/callback` como URI de redirección autorizada. Configura `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` y `FRONTEND_CALLBACK_URL` según `.env.example`, ejecuta `npm run migration:run` y reinicia la API. En modo de prueba de Google, agrega los usuarios de prueba. No subas las credenciales.

La API está bajo `/api/v1`. El frontend accede directamente a la API mediante CORS, sin proxy. En el frontend configura `API_BASE` en `src/app/features/auth/auth.service.ts` para el entorno de despliegue; en desarrollo apunta a `http://localhost:3000/api/v1`. Agrega otros orígenes permitidos a `CORS_ORIGINS`. El navegador inicia el flujo en `/auth/oidc/google/login`, Google vuelve a la API y esta redirige al frontend con un código de un solo uso. El frontend canjea ese código por un JWT con una cookie temporal HttpOnly. Frontend y API deben compartir sitio (por ejemplo localhost con distintos puertos, o subdominios HTTPS del mismo dominio) para que funcione la cookie SameSite=Lax.

Los flujos temporales se guardan en PostgreSQL. Un correo ya registrado solo se vincula automáticamente si está verificado tanto en Google como en la aplicación. Una cuenta nueva creada con Google puede establecer contraseña mediante recuperación. La ruta protegida `/auth/oidc/google/link` permite vincular desde una sesión local autenticada.
