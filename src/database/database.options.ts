import { join } from 'node:path';
import type { DataSourceOptions } from 'typeorm';
import type { DatabaseConfig } from '../config/database.config.js';

export const buildDataSourceOptions = (
  config: DatabaseConfig,
): DataSourceOptions => ({
  type: 'postgres',
  ...config,
  entities: [join(import.meta.dirname, '../**/*.entity{.ts,.js}')],
  migrations: [join(import.meta.dirname, 'migrations/*{.ts,.js}')],
  migrationsTableName: 'migrations',
  synchronize: false,
});
