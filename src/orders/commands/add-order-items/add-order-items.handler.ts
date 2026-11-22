import { NotFoundException } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { Order } from '../../entities/order.entity.js';
import { lockOpenSession, saveOrderItems } from '../order-items.js';
import { AddOrderItemsCommand } from './add-order-items.command.js';

@CommandHandler(AddOrderItemsCommand)
export class AddOrderItemsHandler implements ICommandHandler<AddOrderItemsCommand> {
  constructor(private readonly db: DataSource) {}
  execute(command: AddOrderItemsCommand) {
    return this.db.transaction(async (manager) => {
      const order = await manager.findOneBy(Order, { id: command.orderId });
      if (!order) throw new NotFoundException('Orden no encontrada');
      await lockOpenSession(manager, order.tableSessionId);
      return saveOrderItems(manager, order.id, command.items);
    });
  }
}
