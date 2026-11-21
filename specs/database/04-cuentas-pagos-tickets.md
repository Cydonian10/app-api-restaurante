# SPEC 04 — Cuenta, pago y ticket de atención

> **Estado:** Implementado
> **Depende de:** SPEC 02, SPEC 03
> **Fecha:** 2026-11-20
> **Objetivo:** Diseñar los datos y reglas para cobrar una atención de mesa y generar su ticket interno.

## Alcance

**Incluye:**

- Un responsable opcional por atención y una cuenta única calculada a partir de sus unidades entregadas.
- Un único pago completo por atención, en efectivo o Yape.
- Los datos necesarios para generar un ticket interno y las reglas de cierre de la atención.

**Fuera de alcance:**

- Servicios, endpoints, generación o impresión del ticket y migraciones.
- Pagos parciales o mixtos, corrección y anulación de pagos, y comprobantes fiscales.

## Modelo de datos

- `TableSession`, en `src/dining/entities/table-session.entity.ts`, incorpora `responsibleName`, texto opcional con el nombre del responsable de la atención; no identifica a un cliente registrado.
- `Payment`, en `src/orders/entities/payment.entity.ts`, contiene `id`, `tableSessionId`, `amount`, `method` y `paidAt`. Referencia la atención con eliminación restringida y tiene una restricción única sobre `tableSessionId`. El importe es decimal, positivo y con dos decimales.
- `PaymentMethod`, en `src/orders/enums/payment-method.enum.ts`, contiene `CASH` y `YAPE`.
- La cuenta es la suma de `unitPrice` de las unidades entregadas de todos los pedidos de la atención. Las unidades canceladas no se cobran. El pago conserva el importe total cobrado y se registra una sola vez por el importe completo.
- Solo se cobra cuando todas las unidades están entregadas o canceladas. Si todas están canceladas, la atención puede cerrarse sin pago. En caso contrario, solo se cierra tras registrar el pago completo.
- El ticket interno se genera a partir de la atención, sus unidades entregadas y el pago; no se guarda una copia del ticket. El responsable se incluye si existe.
- La unicidad, el importe positivo y las referencias se declaran en la base de datos. La comprobación del total, los estados y el cierre requieren validación transaccional en la futura capa de aplicación; las entidades por sí solas no garantizan estas reglas frente a concurrencia.

## Plan de implementación

1. Agregar el nombre opcional del responsable a `TableSession`.
2. Definir `PaymentMethod` y `Payment`, sus relaciones y restricciones.
3. Documentar las reglas de cálculo, cobro y cierre que requieren validación transaccional y los datos del ticket interno.
4. Verificar la compilación y los metadatos de TypeORM sin generar ni ejecutar migraciones.

## Criterios de aceptación

- [x] Una atención admite un responsable opcional y como máximo un pago.
- [x] El pago registra importe positivo, fecha y un único medio entre efectivo y Yape.
- [x] La cuenta suma únicamente unidades entregadas y excluye las canceladas.
- [x] Se documenta que no se cobra mientras existan unidades pendientes de entrega y que el pago cubre el total completo.
- [x] Se documenta que la atención solo se cierra después del pago, salvo cuando todas sus unidades están canceladas.
- [x] Los datos persistidos permiten generar el ticket interno sin almacenar una copia.
- [x] Se distinguen las restricciones de base de datos de las reglas que requieren validación transaccional.
- [x] No se agregan servicios, endpoints ni impresión y no se generan ni ejecutan migraciones.

## Decisiones

- **Sí:** una cuenta y un responsable opcional por atención, sin identificar formalmente al cliente.
- **Sí:** un pago completo mediante efectivo o Yape; no se combinan medios.
- **Sí:** excluir cancelaciones y permitir el cierre sin pago si todas las unidades fueron canceladas.
- **Sí:** generar el ticket interno desde los datos persistidos, sin guardar una copia.
- **No:** incluir corrección o anulación del pago, ni emisión fiscal, en esta especificación.

## Riesgos

- Las reglas entre pedidos, pago y cierre requieren protección transaccional frente a cambios concurrentes.
- La base existente no reflejará el modelo hasta generar, revisar y ejecutar una migración posterior.

## Qué no incluye esta especificación

- Migraciones, servicios, endpoints, impresión, pagos parciales o mixtos, corrección o anulación de pagos y comprobantes fiscales.
