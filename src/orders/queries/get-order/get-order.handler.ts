import { NotFoundException } from '@nestjs/common';
import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { ordersWithItems } from '../orders-query.js';
import { GetOrderQuery } from './get-order.query.js';

@QueryHandler(GetOrderQuery)
export class GetOrderHandler implements IQueryHandler<GetOrderQuery> {
  constructor(private readonly db: DataSource) {}

  async execute(query: GetOrderQuery) {
    const order = await ordersWithItems(this.db)
      .where('order.id = :id', { id: query.orderId })
      .getOne();
    if (!order) throw new NotFoundException('Orden no encontrada');
    return order;
  }
}
