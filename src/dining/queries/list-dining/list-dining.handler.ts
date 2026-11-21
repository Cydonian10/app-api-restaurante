import { DataSource, IsNull } from 'typeorm';
import { DiningTable } from '../../entities/dining-table.entity.js';
import { TableSession } from '../../entities/table-session.entity.js';
import { Zone } from '../../entities/zone.entity.js';

import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import { ListDiningQuery } from './list-dining.query.js';

@QueryHandler(ListDiningQuery)
export class ListDiningHandler implements IQueryHandler<ListDiningQuery> {
  constructor(private readonly db: DataSource) {}
  execute(_query: ListDiningQuery) {
    return this.list();
  }
  async list() {
    const zones = await this.db
      .getRepository(Zone)
      .find({ where: { active: true }, order: { name: 'ASC' } });
    const tables = await this.db
      .getRepository(DiningTable)
      .find({ where: { active: true }, order: { number: 'ASC' } });
    const sessions = await this.db
      .getRepository(TableSession)
      .find({ where: { closedAt: IsNull() } });
    const occupied = new Set(sessions.map((session) => session.tableId));
    return zones.map((zone) => ({
      ...zone,
      tables: tables
        .filter((table) => table.zoneId === zone.id)
        .map((table) => ({
          ...table,
          status: occupied.has(table.id)
            ? 'OCCUPIED'
            : table.outOfService
              ? 'OUT_OF_SERVICE'
              : 'AVAILABLE',
        })),
    }));
  }
}
