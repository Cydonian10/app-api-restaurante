import { Module } from '@nestjs/common';
import { CreateOrderHandler } from './commands/create-order/create-order.handler.js';
import { AddOrderItemsHandler } from './commands/add-order-items/add-order-items.handler.js';
import { GetOrderHandler } from './queries/get-order/get-order.handler.js';
import { ListOrdersHandler } from './queries/list-orders/list-orders.handler.js';

@Module({ providers: [CreateOrderHandler, AddOrderItemsHandler, GetOrderHandler, ListOrdersHandler] })
export class OrdersModule {}
