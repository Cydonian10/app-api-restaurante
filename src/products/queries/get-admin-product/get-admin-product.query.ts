import { Query } from '@nestjs/cqrs';
import type { ProductResponse } from '../../dtos/product-response.js';

export class GetAdminProductQuery extends Query<ProductResponse> {
  constructor(public readonly id: string) {
    super();
  }
}
