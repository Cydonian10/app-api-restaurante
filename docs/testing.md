## Reglas a adoptar

## Testing

- Seguir las convenciones y herramientas de testing existentes en el proyecto.
- Utilizar AAA (Arrange, Act, Assert) cuando mejore la legibilidad.
- Nombrar los tests según el comportamiento esperado.
- Agrupar los tests con `describe` por clase y método.
- Mantener los unit tests junto al archivo que prueban, usando `.spec.ts`.
- Ubicar los tests E2E en `test/`, usando `.e2e-spec.ts`.
- Cada test debe ser independiente y verificar un comportamiento concreto.
- Utilizar mocks para aislar dependencias externas en pruebas unitarias.
- Evitar duplicación mediante fixtures o factories cuando corresponda.
- Probar escenarios exitosos, errores y casos límite relevantes.
- Evitar tests que únicamente verifiquen detalles internos de implementación.
- No modificar código de producción solo para conseguir que un test pase sin justificar el cambio.
- Ejecutar los tests relacionados después de realizar cambios.
- Consultar la documentación oficial de NestJS si existen dudas sobre las herramientas de testing.
- No añadir nuevas librerías ni modificar la configuración de testing sin autorización.
