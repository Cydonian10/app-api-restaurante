import { Module } from '@nestjs/common';
import { CreateOrderHandler } from './commands/create-order/create-order.handler.js';
import { AddOrderItemsHandler } from './commands/add-order-items/add-order-items.handler.js';

@Module({ providers: [CreateOrderHandler, AddOrderItemsHandler] })
export class OrdersModule {}
