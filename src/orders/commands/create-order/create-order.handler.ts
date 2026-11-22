import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { Order } from '../../entities/order.entity.js';
import { lockOpenSession, saveOrderItems } from '../order-items.js';
import { CreateOrderCommand } from './create-order.command.js';

@CommandHandler(CreateOrderCommand)
export class CreateOrderHandler implements ICommandHandler<CreateOrderCommand> {
  constructor(private readonly db: DataSource) {}
  execute(command: CreateOrderCommand) {
    return this.db.transaction(async manager => {
      await lockOpenSession(manager, command.tableSessionId);
      const order = await manager.save(Order, { tableSessionId: command.tableSessionId });
      const items = await saveOrderItems(manager, order.id, command.items);
      return { ...order, items };
    });
  }
}
