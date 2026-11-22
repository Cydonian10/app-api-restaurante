import { Module } from '@nestjs/common';
import { CreateOrderHandler } from './commands/create-order/create-order.handler.js';
import { AddOrderItemsHandler } from './commands/add-order-items/add-order-items.handler.js';
import { GetOrderHandler } from './queries/get-order/get-order.handler.js';
import { ListOrdersHandler } from './queries/list-orders/list-orders.handler.js';
import { OrdersController } from './controllers/orders.controller.js';
import { TableSessionOrdersController } from './controllers/table-session-orders.controller.js';
import { OrdersGuard } from './guards/orders.guard.js';

@Module({
  controllers: [OrdersController, TableSessionOrdersController],
  providers: [
    OrdersGuard,
    CreateOrderHandler,
    AddOrderItemsHandler,
    GetOrderHandler,
    ListOrdersHandler,
  ],
})
export class OrdersModule {}
