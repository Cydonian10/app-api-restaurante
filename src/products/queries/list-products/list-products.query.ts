import { Query } from '@nestjs/cqrs';
import type { ListProductsDto } from '../../dtos/list-products.dto.js';
import type { ProductResponse } from '../../dtos/product-response.js';
export interface ProductPage {
  items: ProductResponse[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
export class ListProductsQuery extends Query<ProductPage> {
  constructor(
    public readonly filters: ListProductsDto,
    public readonly admin: boolean,
  ) {
    super();
  }
}
