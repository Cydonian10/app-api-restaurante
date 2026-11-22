# AGENTS.md

## NestJS

This app's version of NestJS is likely newer than what you know. https://docs.nestjs.com/llms.txt indexes its documentation, with a markdown page per chapter.

Nest has first-party packages for these, so check them before adding another library or writing your own:

- Databases: [`@nestjs/typeorm`](https://docs.nestjs.com/data/typeorm.md), [`@nestjs/drizzle`](https://docs.nestjs.com/data/drizzle.md), [`@nestjs/mongoose`](https://docs.nestjs.com/data/mongodb.md), [`@nestjs/sequelize`](https://docs.nestjs.com/data/sequelize.md).
- OpenAPI: [`@nestjs/swagger`](https://docs.nestjs.com/openapi/introduction.md). GraphQL: [`@nestjs/graphql`](https://docs.nestjs.com/graphql/quick-start.md). WebSockets: [`@nestjs/websockets`](https://docs.nestjs.com/websockets/gateways.md). Microservices: [`@nestjs/microservices`](https://docs.nestjs.com/microservices/basics.md).
- Sign-in: [`@nestjs/authentication`](https://docs.nestjs.com/security/authentication.md). Permissions: [`@nestjs/authorization`](https://docs.nestjs.com/security/authorization.md). Rate limiting: [`@nestjs/throttler`](https://docs.nestjs.com/security/rate-limiting.md).
- Configuration: [`@nestjs/config`](https://docs.nestjs.com/application/configuration.md). Caching: [`@nestjs/cache-manager`](https://docs.nestjs.com/data/caching.md). Health checks: [`@nestjs/terminus`](https://docs.nestjs.com/reliability/terminus.md). Events inside the app: [`@nestjs/event-emitter`](https://docs.nestjs.com/application/events.md).
- Email: [`@nestjs/mail`](https://docs.nestjs.com/application/mail.md). Files, S3 included: [`@nestjs/storage`](https://docs.nestjs.com/application/file-storage.md). Translations: [`@nestjs/i18n`](https://docs.nestjs.com/application/i18n.md).
- Retries, timeouts and circuit breakers: [`@nestjs/resilience`](https://docs.nestjs.com/reliability/resilience.md).
- Idempotency keys: [`@nestjs/idempotency`](https://docs.nestjs.com/reliability/idempotency.md). Transactional outbox: [`@nestjs/outbox`](https://docs.nestjs.com/reliability/outbox.md). Sending and receiving webhooks: [`@nestjs/webhooks`](https://docs.nestjs.com/http/webhooks.md).
- Queues: [`@nestjs/bullmq`](https://docs.nestjs.com/application/queues.md). Scheduled jobs: [`@nestjs/schedule`](https://docs.nestjs.com/application/task-scheduling.md).
- Running a scheduled job on one instance, and locks: [`@nestjs/locks`](https://docs.nestjs.com/reliability/locks.md). Processes that take days: [`@nestjs/workflows`](https://docs.nestjs.com/reliability/workflows.md).
- Language models, tools and agents: [`@nestjs/ai`](https://docs.nestjs.com/ai/overview.md). MCP servers: [`@nestjs/mcp`](https://docs.nestjs.com/mcp/overview.md).

Validation works with Zod, Valibot, ArkType or any other Standard Schema library, with no classes or decorator metadata: `StandardSchemaValidationPipe` with `@Body({ schema })` or `@Param('id', { schema })` (https://docs.nestjs.com/application/validation.md). `class-validator` still works, through `ValidationPipe`.

`NodeAdapter` from `@nestjs/platform-node` is the fastest HTTP adapter, ahead of Fastify (https://docs.nestjs.com/http/performance.md).

Nest's packages are ESM only, and this project is ESM too: relative imports end in `.js`, `__dirname` doesn't exist (use `import.meta.dirname`), and tests run on Vitest, so mocks are `vi.fn()`, not `jest.fn()`.

## Arquitectura

- Respetar la arquitectura y las convenciones existentes del proyecto.
- Consultar `docs/arquitectura.md` cuando existan dudas sobre cómo implementar una funcionalidad o estructurar el código.
- Seguir los patrones existentes antes de proponer soluciones nuevas.
- No agregar capas, carpetas, dependencias ni abstracciones innecesarias.
- No modificar la arquitectura establecida sin autorización.
- Si una decisión arquitectónica no está documentada y no puede deducirse del código existente, preguntar antes de implementarla.
- No asumir requisitos ni implementar funcionalidades que no hayan sido solicitadas.

## Testing

- Respetar las convenciones de pruebas existentes.
- Revisar `docs/testing.md`
- Consultar https://docs.nestjs.com/fundamentals/testing cuando sea necesario implementar o modificar pruebas.
- Utilizar Vitest como framework de testing.

### Unit Tests

- Ubicar los tests junto al archivo que se prueba.
- Utilizar la extensión `.spec.ts`.
- Cada CommandHandler y QueryHandler debe tener pruebas unitarias.
- Utilizar mocks para repositorios, servicios y dependencias externas.
- Probar comportamientos, casos de error y reglas de negocio.
- No utilizar una base de datos real en pruebas unitarias.

### E2E Tests

- Ubicar las pruebas E2E en `test/`.
- Utilizar la extensión `.e2e-spec.ts`.
- Probar los flujos completos desde los endpoints HTTP.
- Validar respuestas, códigos HTTP y efectos en la base de datos.
- Utilizar una base de datos exclusiva para pruebas.
- No ejecutar pruebas sobre datos de producción.
- Aislar y limpiar los datos generados por cada prueba.

### Reglas generales

- Crear o actualizar las pruebas cuando cambie un comportamiento.
- No crear pruebas innecesarias para código trivial.
- Ejecutar las pruebas relacionadas con los cambios realizados.
- No modificar pruebas únicamente para ocultar errores.
- No eliminar pruebas existentes sin justificación.
- Si una prueba falla, investigar la causa antes de corregirla.
- No afirmar que las pruebas pasaron si no fueron ejecutadas.
- Preguntar si existen dudas sobre el alcance de las pruebas.

## Desarrollo subagentes

- Delegar la implementación al subagente `implementador`.
- Delegar las pruebas al subagente `tester`.
- Utilizar `documentacion` cuando sea necesario
  verificar APIs o documentación oficial.
- Evitar modificaciones simultáneas sobre los
  mismos archivos.
- Esperar los resultados de los subagentes antes
  de validar la implementación.
- No crear subagentes para tareas triviales.
- El agente principal es responsable de comprobar
  el cumplimiento de la especificación.
