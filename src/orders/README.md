# Reglas pendientes para pedidos

Las entidades declaran las relaciones, la unicidad de la selección por unidad, el precio no negativo y la coherencia entre estado y fecha de entrega. Las siguientes reglas requieren validación transaccional en una futura capa de aplicación o restricciones adicionales en la base de datos, con protección frente a operaciones concurrentes:

- Crear pedidos solamente para atenciones abiertas y cerrar una atención solamente cuando todas sus unidades estén entregadas o canceladas.
- Asociar selecciones solamente a unidades de productos `MENU`. Cada selección admite un `EXTRA` y una `BEBIDA_MENU` opcionales y gratuitos, sin incrementar el precio de la unidad.
- Permitir avanzar omitiendo estados intermedios y cancelar una unidad únicamente antes de entregarla; conservar las cancelaciones en el historial.

Las opciones gratuitas conservan únicamente referencias a los productos actuales y no tienen seguimiento de entrega separado.
