import 'dotenv/config';
import { DataSource } from 'typeorm';
import { getDatabaseConfig } from '../config/database.config.js';
import { buildDataSourceOptions } from './database.options.js';

export const AppDataSource = new DataSource(
  buildDataSourceOptions(getDatabaseConfig()),
);
