import { registerAs } from '@nestjs/config';

export type DatabaseConfig = {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
};

export function getDatabaseConfig(): DatabaseConfig {
  const port = Number(process.env.DB_PORT ?? 5432);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('DB_PORT debe ser un puerto válido entre 1 y 65535');
  }

  return {
    host: process.env.DB_HOST ?? 'localhost',
    port,
    username: process.env.DB_USERNAME ?? 'restaurante',
    password: process.env.DB_PASSWORD ?? 'restaurante',
    database: process.env.DB_DATABASE ?? 'restaurante',
  };
}

export default registerAs('database', getDatabaseConfig);
