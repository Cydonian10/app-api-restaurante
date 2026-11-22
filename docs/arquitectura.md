mi-proyecto/
│
├── AGENTS.md
├── docs/
│ └── architecture.md
│
├── src/
│ ├── main.ts
│ ├── app.module.ts
│ │
│ ├── modules/
│ │ └── productos/
│ │ │
│ │ ├── productos.module.ts
│ │ │
│ │ ├── commands/
│ │ │ ├── crear-producto/
│ │ │ │ ├── crear-producto.command.ts
│ │ │ │ ├── crear-producto.handler.ts
│ │ │ │ └── crear-producto.handler.spec.ts
│ │ │ │
│ │ │ ├── actualizar-producto/
│ │ │ │ ├── actualizar-producto.command.ts
│ │ │ │ ├── actualizar-producto.handler.ts
│ │ │ │ └── actualizar-producto.handler.spec.ts
│ │ │ │
│ │ │ └── eliminar-producto/
│ │ │ ├── eliminar-producto.command.ts
│ │ │ ├── eliminar-producto.handler.ts
│ │ │ └── eliminar-producto.handler.spec.ts
│ │ │
│ │ ├── queries/
│ │ │ ├── listar-productos/
│ │ │ │ ├── listar-productos.query.ts
│ │ │ │ ├── listar-productos.handler.ts
│ │ │ │ └── listar-productos.handler.spec.ts
│ │ │ │
│ │ │ └── obtener-producto/
│ │ │ ├── obtener-producto.query.ts
│ │ │ ├── obtener-producto.handler.ts
│ │ │ └── obtener-producto.handler.spec.ts
│ │ │
│ │ ├── controllers/
| | |   |_productos/
│ │ │    ├── productos.controller.ts
│ │ │    └── productos.controller.spec.ts
│ │ │
│ │ ├── dtos/
│ │ │ ├── crear-producto/
│ │ │ │ ├── crear-producto.dto.ts
│ │ │ │ └── crear-producto.dto.spec.ts
│ │ │ ├── actualizar-producto/
│ │ │ │ └── actualizar-producto.dto.ts
│ │ │ └── producto-response.dto.ts
│ │ │
│ │ ├── mappers/
│ │ │ ├── producto.mapper.ts
│ │ │ └── producto.mapper.spec.ts
│ │ │
│ │ ├── entities/
│ │ │ └── producto.entity.ts
│ │ │
│ │ └── utils/
│ │
│ ├── common/
│ │ ├── dtos/
│ │ │ └── paginacion/
│ │ │ └── paginacion.dto.ts
│ │ ├── pipes/
│ │ ├── guards/
│ │ ├── middlewares/
│ │ ├── filters/
│ │ ├── interceptors/
│ │ ├── logger/
│ │ └── utils/
│ │ └── pdf/
│ │
│ ├── database/
│ │ ├── migrations/
│ │ └── data-source.ts
│ │
│ └── config/
│ ├── mail.config.ts
│ ├── database.config.ts
│ └── auth.config.ts
│
└── test/
└── productos.e2e-spec.ts

` Las carpetas que no tengan una necesidad real todavía no tienen que crearse.`

## 2. Responsabilidad de cada carpeta

Carpeta Responsabilidad
commands/ Operaciones que modifican el estado: crear, actualizar, eliminar o ejecutar transacciones.
queries/ Consultar información sin modificar el estado.
controllers/ Recibir peticiones HTTP, aplicar validación mediante DTO y pipes, y ejecutar buses CQRS.
dtos/ Definir y validar datos de entrada y establecer contratos de respuesta.
mappers/ Transformar entidades o resultados a DTO de respuesta.
entities/ Definir las entidades de persistencia, por ejemplo con TypeORM.
utils/ Funciones auxiliares propias del módulo tambien que son globales.
common/ Componentes técnicos reutilizables entre módulos.
database/ Configuración de acceso a datos y migraciones.
config/ Configuración de servicios e integraciones.
