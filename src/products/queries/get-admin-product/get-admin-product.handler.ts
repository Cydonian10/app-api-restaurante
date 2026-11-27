import { NotFoundException } from '@nestjs/common';
import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { toProductResponse } from '../../dtos/product-response.js';
import { Product } from '../../entities/product.entity.js';
import { GetAdminProductQuery } from './get-admin-product.query.js';

@QueryHandler(GetAdminProductQuery)
export class GetAdminProductHandler implements IQueryHandler<GetAdminProductQuery> {
  constructor(
    @InjectRepository(Product) private readonly products: Repository<Product>,
  ) {}

  async execute({ id }: GetAdminProductQuery) {
    const product = await this.products.findOneBy({ id, deletedAt: IsNull() });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return toProductResponse(product);
  }
}
