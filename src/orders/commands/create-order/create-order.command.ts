import { type OrderLine } from '../order-items.js';
export class CreateOrderCommand {
  constructor(public readonly tableSessionId: string, public readonly items: OrderLine[]) {}
}
