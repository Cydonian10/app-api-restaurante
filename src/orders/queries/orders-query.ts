import { type DataSource } from 'typeorm';
import { Order } from '../entities/order.entity.js';
import { MenuSelection } from '../entities/menu-selection.entity.js';

export function ordersWithItems(db: DataSource) {
  return db
    .getRepository(Order)
    .createQueryBuilder('order')
    .leftJoinAndSelect('order.items', 'item')
    .leftJoinAndMapOne(
      'item.menuSelection',
      MenuSelection,
      'selection',
      'selection.orderItemId = item.id',
    );
}
