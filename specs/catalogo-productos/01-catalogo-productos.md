# SPEC 01 — Catálogo de productos

> **Estado:** Implementado
> **Depende de:** Ninguna
> **Fecha:** 2026-11-19
> **Objetivo:** Crear y consultar productos del restaurante con disponibilidad e imágenes en almacenamiento intercambiable.

## Alcance

**Incluye:**

- Crear productos, con imagen opcional, y subir una imagen después de crearlos.
- Listar públicamente productos disponibles, con paginación y filtro opcional por tipo.
- Permitir a administradores listar productos disponibles y no disponibles y cambiar su disponibilidad.
- Almacenar imágenes mediante una abstracción con proveedores Cloudinary y local, seleccionables por configuración.
- Documentar y probar los endpoints, la configuración y las validaciones.

**Fuera de alcance:**

- Pedidos y reglas de selección de extras o de un máximo de un postre por plato principal.
- Edición de otros datos del producto, eliminación y consulta individual.
- Interfaz de usuario e inventario.

## Modelo de datos

- `Producto`: identificador, `nombre`, `descripcion` opcional, `precio`, `tipo`, `disponible`, referencia de imagen opcional, `createdAt` y `updatedAt`.
- `tipo`: enum con valores `BEBIDA`, `EXTRA`, `PLATO_FONDO` y `POSTRE`.
- Un producto es principal cuando su tipo es `PLATO_FONDO`; este valor se deriva del tipo y no se persiste como otro campo.
- El precio admite cero y hasta dos decimales; se almacena con precisión decimal en PostgreSQL.
- `disponible` es verdadero por defecto. La referencia de imagen permite obtener la URL pública y conservar la información necesaria para identificar su proveedor y archivo.
- Las imágenes admitidas son JPG, PNG y WebP de hasta 5 MB. El archivo es opcional al crear el producto y se envía como multipart cuando se proporciona.

## Plan de implementación

1. Agregar en `src/products/` la entidad, el enum y la migración en `src/database/migrations/`, y registrar el módulo en `src/app.module.ts`.
2. Añadir el contrato de almacenamiento de imágenes y los proveedores Cloudinary y local. Seleccionar el proveedor por configuración, con Cloudinary por defecto; documentar variables y acceso a archivos locales en `.env.example` y `README.md`.
3. Implementar la creación multipart de productos para administradores, con validación del producto y del archivo opcional.
4. Implementar la carga posterior de imagen para administradores y mantener la referencia persistida consistente ante errores del proveedor.
5. Implementar el listado público paginado de productos disponibles y su filtro por tipo, y el listado administrativo de todos los productos.
6. Implementar el cambio de disponibilidad para administradores y documentar los endpoints y errores en Swagger.
7. Añadir pruebas de comportamiento para permisos, validaciones, persistencia, listados, disponibilidad y ambos proveedores de almacenamiento.

## Criterios de aceptación

- [ ] Un administrador puede crear un producto con nombre, tipo válido, precio no negativo y descripción e imagen opcionales.
- [ ] Los cuatro tipos aceptados son `BEBIDA`, `EXTRA`, `PLATO_FONDO` y `POSTRE`; se rechazan los demás.
- [ ] El precio acepta cero y hasta dos decimales y rechaza valores negativos o con más de dos decimales.
- [ ] Los productos nuevos están disponibles y solo los de tipo `PLATO_FONDO` se consideran principales.
- [ ] Una imagen JPG, PNG o WebP de hasta 5 MB se puede enviar al crear el producto o subir posteriormente; se rechazan formatos y tamaños no permitidos.
- [ ] Cloudinary es el proveedor predeterminado y la configuración permite seleccionar el proveedor local; ambos entregan una referencia de imagen accesible.
- [ ] Si falla el almacenamiento de una imagen, la API informa el error y no guarda una referencia a una imagen inexistente.
- [ ] Un visitante puede listar únicamente productos disponibles, paginar los resultados y filtrarlos por tipo.
- [ ] Un administrador puede listar productos disponibles y no disponibles, y cambiar la disponibilidad de un producto existente.
- [ ] Las operaciones administrativas requieren autenticación y rol `ADMIN`; un usuario sin permisos no puede ejecutarlas.
- [ ] La migración se ejecuta sobre PostgreSQL y las pruebas pertinentes y la compilación pasan.

## Decisiones

- **Sí:** derivar `principal` del tipo `PLATO_FONDO`, evitando duplicar información.
- **Sí:** descripción e imagen opcionales, precio cero permitido y disponibilidad inicial activa.
- **Sí:** Cloudinary y almacenamiento local detrás de una abstracción configurable.
- **No:** aplicar ahora las reglas de extras y postres; se definirán junto con los pedidos.

## Riesgos

- Los archivos locales dependen de almacenamiento persistente y de una URL accesible en el despliegue; documentar ambas necesidades.
- Fallos de Cloudinary o del disco pueden impedir la carga de imágenes; no se debe persistir una referencia inexistente.

## Qué no incluye esta especificación

- Pedidos, reglas de combinación de productos y límites de extras o postres.
- Edición general, eliminación, detalle individual, inventario e interfaz de usuario.
