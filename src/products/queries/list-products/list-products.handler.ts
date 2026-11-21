import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Product } from '../../entities/product.entity.js';
import { ListProductsQuery } from './list-products.query.js';
@QueryHandler(ListProductsQuery)
export class ListProductsHandler implements IQueryHandler<ListProductsQuery> {
  constructor(
    @InjectRepository(Product) private readonly products: Repository<Product>,
  ) {}
  async execute({ filters: query, admin }: ListProductsQuery) {
    const { page, limit, tipo } = query;
    const where = {
      deletedAt: IsNull(),
      ...(admin ? {} : { disponible: true }),
      ...(tipo ? { tipo } : {}),
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
      items: products.map((product) => ({
        id: product.id,
        nombre: product.nombre,
        descripcion: product.descripcion,
        precio: product.precio,
        tipo: product.tipo,
        principal: product.principal,
        disponible: product.disponible,
        imageUrl: product.imageUrl,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      })),
      page,
      limit,
      total,
      totalPages,
    };
  }
}
