# SPEC 02 — Zonas, mesas y atenciones

> **Estado:** Aprobado
> **Depende de:** Ninguna
> **Fecha:** 2026-11-20
> **Objetivo:** Diseñar en TypeORM los datos y reglas de zonas, mesas y atenciones de un restaurante.

## Alcance

**Incluye:**

- Modelo persistente de zonas, mesas y atenciones para un restaurante, con historial de atenciones.
- Identificación de cada mesa mediante un número único dentro de su zona, capacidad máxima y desactivación lógica.
- Reglas para apertura, modificación y cierre de atenciones y para el estado de las mesas.

**Fuera de alcance:**

- Endpoints, servicios y ejecución o generación de migraciones.
- Pedidos, estados de preparación, cobros, reservas, sucursales e identidad de los clientes.

## Modelo de datos

- `Zone` en `src/dining/entities/zone.entity.ts`: `id`, `name`, `active`, `createdAt` y `updatedAt`; tiene varias mesas.
- `DiningTable` en `src/dining/entities/dining-table.entity.ts`: `id`, `zoneId`, `number`, `capacity`, `active`, `outOfService`, `createdAt` y `updatedAt`. Su zona es fija; el número es positivo y único por zona, y la capacidad es positiva.
- `TableSession` en `src/dining/entities/table-session.entity.ts`: `id`, `tableId`, `partySize`, `openedAt`, `closedAt`, `createdAt` y `updatedAt`. El número de personas es positivo y `closedAt` es nulo mientras la atención está abierta. El cierre no puede preceder a la apertura.
- PostgreSQL debe impedir dos atenciones abiertas para la misma mesa mediante un índice único parcial. Las referencias usan eliminación restringida para preservar el historial.
- Una mesa activa está **ocupada** cuando tiene una atención abierta; sin atención abierta está **fuera de servicio** si `outOfService` es verdadero y, en caso contrario, está **disponible**. Una mesa desactivada no está disponible para atención.
- Solo se abre una atención en una zona y mesa activas y una mesa disponible. El número de personas puede modificarse durante la atención y debe permanecer entre uno y la capacidad de la mesa; se conserva el valor final. Una mesa ocupada no puede ponerse fuera de servicio.
- Una mesa solo puede desactivarse sin atención abierta. Una zona solo puede desactivarse cuando todas sus mesas están desactivadas y no tienen atenciones abiertas. La mesa no puede cambiar de zona.
- Las restricciones entre registros, incluidas capacidad, desactivación, disponibilidad y cambio de zona, requieren validación transaccional en la futura capa de aplicación o restricciones adicionales de base de datos; las entidades por sí solas no las garantizan.

## Plan de implementación

1. Definir `Zone`, `DiningTable` y `TableSession` con sus relaciones y columnas en `src/dining/entities/`.
2. Declarar las restricciones de valores positivos, unicidad por zona, fechas y una sola atención abierta por mesa.
3. Verificar la compilación y revisar los metadatos de TypeORM antes de generar una migración en un trabajo posterior.

## Criterios de aceptación

- [ ] Las entidades representan zonas, mesas y atenciones con las relaciones y campos descritos y compilan.
- [ ] El modelo declara una restricción única para el número de mesa dentro de cada zona y un índice único parcial para la atención abierta de cada mesa.
- [ ] El modelo declara restricciones para números de mesa, capacidades y cantidades de personas positivas, así como para la fecha de cierre.
- [ ] Se documentan las reglas que necesitan implementación adicional y se distingue el estado derivado de ocupación del indicador de fuera de servicio.
- [ ] No se generan ni ejecutan migraciones y no se agregan endpoints como parte de este diseño.

## Decisiones

- **Sí:** conservar las atenciones cerradas con sus fechas y cantidad final de personas.
- **Sí:** derivar la ocupación de la atención abierta para no duplicar el estado.
- **Sí:** permitir números de mesa repetidos en zonas distintas y guardar una capacidad máxima.
- **No:** trasladar mesas entre zonas ni identificar a cada cliente.
- **No:** incluir pedidos o usar «plato listo» como estado físico de la mesa; los pedidos se definirán aparte y podrán asociarse a una atención.

## Riesgos

- Las reglas entre tablas no quedan garantizadas solo con decoradores de entidades; la futura implementación debe protegerlas también frente a operaciones concurrentes.
- La base existente no tendrá estas tablas hasta generar, revisar y ejecutar la migración correspondiente.

## Qué no incluye esta especificación

- Migraciones, endpoints, servicios, pedidos, cobros, reservas, sucursales ni interfaz de usuario.
