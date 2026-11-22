import { NotFoundException } from '@nestjs/common';
import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { TableSession } from '../../../dining/entities/table-session.entity.js';
import { ordersWithItems } from '../orders-query.js';
import { ListOrdersQuery } from './list-orders.query.js';

@QueryHandler(ListOrdersQuery)
export class ListOrdersHandler implements IQueryHandler<ListOrdersQuery> {
  constructor(private readonly db: DataSource) {}

  async execute(query: ListOrdersQuery) {
    const session = await this.db
      .getRepository(TableSession)
      .findOneBy({ id: query.tableSessionId });
    if (!session) throw new NotFoundException('Atención no encontrada');
    return ordersWithItems(this.db)
      .where('order.tableSessionId = :id', { id: query.tableSessionId })
      .orderBy('order.createdAt', 'ASC')
      .addOrderBy('item.createdAt', 'ASC')
      .getMany();
  }
}
