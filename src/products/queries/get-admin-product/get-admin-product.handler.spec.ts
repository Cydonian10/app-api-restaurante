import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { IsNull, type Repository } from 'typeorm';
import { Product } from '../../entities/product.entity.js';
import { ProductType } from '../../enums/product-type.enum.js';
import { GetAdminProductHandler } from './get-admin-product.handler.js';
import { GetAdminProductQuery } from './get-admin-product.query.js';

describe('GetAdminProductHandler', () => {
  it('devuelve un producto no disponible y excluye datos internos', async () => {
    const product = Object.assign(new Product(), {
      id: 'id',
      nombre: 'Lomo saltado',
      descripcion: 'Con papas',
      precio: '28.00',
      tipo: ProductType.PLATO_FONDO,
      disponible: false,
      imageUrl: '/image.png',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      imageKey: 'secret',
      imageProvider: 'local',
    });
    const products = { findOneBy: vi.fn().mockResolvedValue(product) };
    const handler = new GetAdminProductHandler(
      products as unknown as Repository<Product>,
    );
    const result = await handler.execute(new GetAdminProductQuery('id'));
    expect(result).toEqual({
      id: product.id,
      nombre: product.nombre,
      descripcion: product.descripcion,
      precio: product.precio,
      tipo: product.tipo,
      principal: true,
      disponible: false,
      imageUrl: product.imageUrl,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    });
    expect(products.findOneBy).toHaveBeenCalledWith({
      id: 'id',
      deletedAt: IsNull(),
    });
  });

  it('rechaza productos inexistentes o excluidos por baja lógica', async () => {
    const products = { findOneBy: vi.fn().mockResolvedValue(null) };
    const handler = new GetAdminProductHandler(
      products as unknown as Repository<Product>,
    );
    await expect(
      handler.execute(new GetAdminProductQuery('missing')),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(products.findOneBy).toHaveBeenCalledWith({
      id: 'missing',
      deletedAt: IsNull(),
    });
  });
});
