import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, IsNull, Repository } from 'typeorm';
import { Product } from '../../entities/product.entity.js';
import { toProductResponse } from '../../dtos/product-response.js';
import { ListProductsQuery } from './list-products.query.js';
@QueryHandler(ListProductsQuery)
export class ListProductsHandler implements IQueryHandler<ListProductsQuery> {
  constructor(
    @InjectRepository(Product) private readonly products: Repository<Product>,
  ) {}
  async execute({ filters: query, admin }: ListProductsQuery) {
    const { page, limit, tipo, nombre } = query;
    const where = {
      deletedAt: IsNull(),
      ...(admin ? {} : { disponible: true }),
      ...(tipo ? { tipo } : {}),
      ...(admin && nombre
        ? { nombre: ILike(`%${nombre.replace(/[\\%_]/g, '\\$&')}%`) }
        : {}),
    };
    const total = await this.products.count({ where });
    const totalPages = Math.ceil(total / limit);
    const products =
      page > totalPages
        ? []
        : await this.products.find({
            where,
            order: { createdAt: 'DESC', id: 'ASC' },
            skip: (page - 1) * limit,
            take: limit,
          });
    return {
      items: products.map(toProductResponse),
      page,
      limit,
      total,
      totalPages,
    };
  }
}
