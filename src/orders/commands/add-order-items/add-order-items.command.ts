import { type OrderLine } from '../order-items.js';
export class AddOrderItemsCommand {
  constructor(
    public readonly orderId: string,
    public readonly items: OrderLine[],
  ) {}
}
