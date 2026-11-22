# SPEC 01 — Creación y consulta de órdenes

> **Estado:** Aprobado
> **Depende de:** SPEC 03 de database
> **Fecha:** 2026-11-22
> **Objetivo:** Crear y consultar órdenes de una atención de mesa y agregarles unidades de productos mientras esté abierta.

## Alcance

**Incluye:**

- Crear varias órdenes por atención, cada una con sus primeros ítems, y agregar ítems posteriormente.
- Consultar una orden y listar las órdenes de una atención, incluso después de cerrada.
- Registrar selecciones opcionales e independientes de extra y bebida para cada unidad de menú.
- Restringir las operaciones a usuarios autenticados con rol `ADMIN`, `ATENCION` o `MOZO`.
- Documentar los endpoints en OpenAPI y seguir CQRS y controladores por recurso según las convenciones existentes.

**Fuera de alcance:**

- Cambios de estado, entrega o cancelación de ítems; cierre de atención; pagos y tickets.
- Interfaz de usuario y seguimiento separado de las opciones gratuitas.

## Modelo de datos y contrato

Se reutilizan `Order`, `OrderItem`, `MenuSelection`, `Product` y `TableSession` existentes. Una atención admite varias órdenes; cada ítem representa una unidad y comienza en `PENDING`. Se copia el nombre y precio del producto al agregarlo. Las opciones gratuitas solo conservan referencias al catálogo y no incrementan el precio.

Cada solicitud de creación o agregado contiene al menos una línea con `productId` y `quantity` entera positiva. Una línea de menú puede incluir selecciones por unidad, cada una con `extraProductId` y `drinkProductId` opcionales. Las selecciones permiten valores diferentes por unidad; las unidades sin selección no tienen acompañamientos. Las selecciones solo aplican a productos `MENU`, el extra debe ser `EXTRA` y la bebida `BEBIDA_MENU`.

- `POST /table-sessions/:id/orders`: crea una orden con sus ítems en una atención abierta.
- `GET /table-sessions/:id/orders`: lista las órdenes de una atención existente, abierta o cerrada.
- `GET /orders/:id`: consulta una orden existente.
- `POST /orders/:id/items`: agrega unidades a una orden cuya atención esté abierta.

Las consultas incluyen los ítems con nombre, precio, estado y selecciones de menú. Una atención u orden inexistente produce 404; una atención cerrada al crear o agregar produce 409. Los productos y opciones inexistentes, no disponibles o eliminados, las selecciones de tipo incorrecto y las solicitudes inválidas se rechazan sin guardar cambios parciales. Las escrituras validan la atención y persisten todos los registros en una transacción protegida contra el cierre concurrente de la atención.

## Plan de implementación

1. Incorporar el módulo de órdenes en la aplicación y las operaciones CQRS de creación y agregado, reutilizando las entidades y validando los productos y la atención dentro de transacciones.
2. Incorporar las consultas CQRS de detalle de orden y listado por atención, incluyendo ítems y selecciones.
3. Exponer los endpoints con controladores por recurso, validación de entrada, autenticación, autorización y documentación OpenAPI.
4. Cubrir los comportamientos y errores con pruebas unitarias de handlers y pruebas HTTP con base de datos exclusiva de pruebas, siguiendo `docs/testing.md`.

## Criterios de aceptación

- [ ] Una atención abierta admite varias órdenes; cada creación guarda la orden y al menos un ítem de forma inmediata.
- [ ] Es posible agregar ítems a cualquiera de esas órdenes mientras su atención permanezca abierta, incluso si sus ítems anteriores están entregados o cancelados.
- [ ] Una cantidad de tres produce tres ítems independientes en estado `PENDING`, cada uno con el nombre y precio vigentes al agregarse.
- [ ] Cada unidad de menú puede tener un extra y una bebida opcionales, independientes y distintos de los de otras unidades.
- [ ] Una solicitud con producto u opción inválida no guarda ningún cambio.
- [ ] Crear o agregar para una atención cerrada responde 409 y no guarda cambios; una atención u orden inexistente responde 404.
- [ ] El detalle de una orden y el listado por atención incluyen sus ítems, estados, precios y selecciones, incluso tras el cierre.
- [ ] Solo `ADMIN`, `ATENCION` y `MOZO` autenticados acceden a estas operaciones.
- [ ] Las escrituras y el cierre concurrente no permiten agregar ítems a una atención ya cerrada.
- [ ] Los endpoints están documentados en OpenAPI y las pruebas relacionadas verifican los escenarios y errores anteriores.

## Decisiones

- **Sí:** varias órdenes por atención y agregado posterior de ítems a cualquiera de ellas.
- **Sí:** creación con el primer pedido y persistencia inmediata, para evitar órdenes vacías y pérdida de pedidos.
- **Sí:** una unidad por ítem y copia de nombre y precio, conforme al modelo existente.
- **Sí:** selecciones gratuitas independientes por unidad de menú.
- **Sí:** usar CQRS y controladores por recurso existentes; introducir otro patrón solo si existe una necesidad concreta.
- **No:** una sola orden obligatoria por atención ni un borrador mantenido solo en memoria.

## Riesgos

- El cierre concurrente de una atención y la escritura de órdenes requieren coordinación transaccional; la implementación del cierre deberá respetar el mismo bloqueo.
- Los nombres de las opciones gratuitas se consultan desde el catálogo actual y pueden cambiar posteriormente.

## Qué no incluye esta especificación

- Cambiar estados, entregar o cancelar ítems, cerrar atenciones, cobrar, generar tickets o crear una interfaz de usuario.
