# SPEC 03 — Pedidos, menús y entregas

> **Estado:** Implementado
> **Depende de:** SPEC 01, SPEC 02
> **Fecha:** 2026-11-20
> **Objetivo:** Diseñar las entidades y reglas de pedidos por atención con menús y seguimiento de entrega por unidad.

## Alcance

**Incluye:**

- Incorporar `MENU` y `BEBIDA_MENU` al tipo de producto existente.
- Modelar varios pedidos durante una atención de mesa y el seguimiento independiente de cada unidad pedida.
- Registrar opciones gratuitas de un menú y conservar el nombre y precio acordados de cada unidad vendida.
- Definir cancelaciones y la condición de cierre de una atención con pedidos.

**Fuera de alcance:**

- Endpoints, servicios, interfaz de usuario y generación o ejecución de migraciones.
- Cobros, facturación y reglas de pago de la mesa.
- Seguimiento de preparación o entrega individual de los acompañamientos gratuitos.

## Modelo de datos

- `ProductType`, en `src/products/enums/product-type.enum.ts`, incorpora `MENU` y `BEBIDA_MENU` a los tipos existentes. Un producto `MENU` representa por sí mismo el plato servido; no exige una referencia adicional a `PLATO_FONDO`. Una `BEBIDA_MENU` puede venderse también por separado.
- `Order`, en `src/orders/entities/order.entity.ts`: `id`, `tableSessionId` y `createdAt`. Referencia a `TableSession` con eliminación restringida. Una atención puede tener varios pedidos, incluso creados en momentos diferentes.
- `OrderItem`, en `src/orders/entities/order-item.entity.ts`: `id`, `orderId`, `productId`, `productName`, `unitPrice`, `status`, `deliveredAt`, `createdAt` y `updatedAt`. Cada registro representa **una unidad**, incluso cuando se pidan varias unidades del mismo producto. Referencia al pedido y al producto con eliminación restringida. `productName` y `unitPrice` conservan el nombre y precio acordados al momento del pedido; cambios posteriores en el catálogo no los modifican. El precio es decimal, no negativo y con dos decimales.
- `MenuSelection`, en `src/orders/entities/menu-selection.entity.ts`: `id`, `orderItemId`, `extraProductId` y `drinkProductId`. Cada referencia de producto es opcional; como máximo existe una selección por unidad de menú. `extraProductId` debe referir a un producto `EXTRA` y `drinkProductId` a uno `BEBIDA_MENU`. Ambos son gratuitos y no incrementan el precio de la unidad. Solo se guardan referencias a los productos actuales, sin copia de sus nombres. Las referencias usan eliminación restringida.
- `OrderItemStatus`, en `src/orders/enums/order-item-status.enum.ts`, contiene `PENDING`, `IN_PREPARATION`, `READY`, `DELIVERED` y `CANCELLED`. Se aplica a toda unidad pedida por separado, incluidos bebidas, extras y postres. Puede avanzarse omitiendo estados intermedios; una unidad entregada no puede cancelarse y una cancelada permanece en el historial.
- `deliveredAt` registra el instante de entrega de cada unidad y solo tiene valor cuando su estado es `DELIVERED`. Los acompañamientos de un menú no tienen estado ni fecha de entrega propios.
- Un pedido solo se agrega a una atención abierta. La atención solo puede cerrarse cuando todas sus unidades estén entregadas o canceladas; esto no define si se ha cobrado.
- Las claves foráneas, unicidad de selección, precio no negativo y coherencia entre estado y fecha de entrega deben declararse como restricciones de base de datos cuando corresponda. La elegibilidad por tipo, la selección solo para menús, la apertura de la atención, las transiciones y el cierre requieren validación transaccional en la futura capa de aplicación o restricciones adicionales en la base de datos. Las entidades por sí solas no garantizan esas reglas frente a operaciones concurrentes.

## Plan de implementación

1. Ampliar `ProductType` con `MENU` y `BEBIDA_MENU`, conservando los tipos existentes.
2. Definir `Order`, su relación con `TableSession` y `OrderItem` con referencias, copias de nombre y precio y restricciones de valor.
3. Definir el enum de estados, el estado y la fecha de entrega por unidad, junto con la restricción de coherencia entre ambos.
4. Definir `MenuSelection`, sus referencias opcionales y su unicidad por unidad, y documentar las reglas que requieren validación adicional.
5. Verificar la compilación y revisar los metadatos de TypeORM, sin generar ni ejecutar migraciones.

## Criterios de aceptación

- [x] Las entidades y el enum compilan y representan las relaciones y campos descritos.
- [x] El catálogo admite los tipos existentes más `MENU` y `BEBIDA_MENU`.
- [x] El modelo representa una atención con cuatro pedidos y unidades de un mismo pedido entregadas en momentos distintos.
- [x] Cada unidad conserva su nombre y precio acordados y tiene estado y fecha de entrega propios.
- [x] Cada menú admite cero o un extra y cero o una bebida de menú gratuitos; se documentan las validaciones de tipo y elegibilidad que requieren implementación adicional.
- [x] El modelo conserva las referencias de las opciones gratuitas sin copiar sus nombres ni registrar sus entregas por separado.
- [x] Se documenta que una unidad puede cancelarse antes de entregarse, que una entregada no puede cancelarse y que la cancelación conserva el historial.
- [x] Se documenta que solo se agregan pedidos a atenciones abiertas y que estas se cierran cuando todas las unidades están entregadas o canceladas.
- [x] Se distinguen las restricciones declaradas en las entidades de las reglas que requieren implementación transaccional adicional.
- [x] No se generan ni ejecutan migraciones y no se agregan endpoints, servicios ni cobros.

## Decisiones

- **Sí:** representar cada unidad por separado para permitir entregas y cancelaciones independientes.
- **Sí:** asociar los pedidos a la atención, no directamente a la mesa, para mantener el historial de cada ocupación.
- **Sí:** tratar `MENU` como el plato y permitir hasta un `EXTRA` y una `BEBIDA_MENU` gratuitos y opcionales.
- **Sí:** conservar nombre y precio de la unidad vendida; guardar solo referencias para las opciones gratuitas.
- **Sí:** conservar las unidades canceladas y permitir omitir estados intermedios.
- **No:** registrar entregas individuales de acompañamientos gratuitos ni resolver el cobro en esta especificación.

## Riesgos

- Las referencias a opciones gratuitas muestran los datos actuales del catálogo: si cambia su nombre, no se conservará el nombre anterior en el pedido.
- Las validaciones entre registros necesitan protección transaccional ante concurrencia; el modelo de entidades por sí solo no las hace efectivas.
- La base existente no reflejará el modelo hasta que se genere, revise y ejecute una migración en un trabajo posterior.

## Qué no incluye esta especificación

- Migraciones, endpoints, servicios, interfaz de usuario, cobros ni facturación.
- Seguimiento individual de entrega de acompañamientos gratuitos.
