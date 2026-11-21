# Reglas pendientes para pedidos

Las entidades declaran las relaciones, la unicidad de la selección por unidad, el precio no negativo y la coherencia entre estado y fecha de entrega. Las siguientes reglas requieren validación transaccional en una futura capa de aplicación o restricciones adicionales en la base de datos, con protección frente a operaciones concurrentes:

- Crear pedidos solamente para atenciones abiertas y cerrar una atención solamente cuando todas sus unidades estén entregadas o canceladas.
- Asociar selecciones solamente a unidades de productos `MENU`. Cada selección admite un `EXTRA` y una `BEBIDA_MENU` opcionales y gratuitos, sin incrementar el precio de la unidad.
- Permitir avanzar omitiendo estados intermedios y cancelar una unidad únicamente antes de entregarla; conservar las cancelaciones en el historial.

Las opciones gratuitas conservan únicamente referencias a los productos actuales y no tienen seguimiento de entrega separado.

## Cuenta, pago y cierre

Una atención tiene una sola cuenta. Su total es la suma de los precios acordados de las unidades entregadas de todos sus pedidos; las unidades canceladas no se cobran. Las entidades declaran un único pago por atención, un importe positivo y la referencia a la atención con eliminación restringida.

La futura capa de aplicación debe validar de forma transaccional, con protección frente a operaciones concurrentes, las siguientes reglas:

- Registrar el pago solo cuando todas las unidades estén entregadas o canceladas y por el total completo de la cuenta, mediante efectivo o Yape.
- Cerrar la atención después de registrar el pago completo. Si todas sus unidades están canceladas, puede cerrarse sin pago.

El ticket interno se genera a partir de la atención, sus unidades entregadas y el pago registrado. Incluye el nombre del responsable cuando existe. No se guarda una copia del ticket. Su generación e impresión quedan para un trabajo posterior.
