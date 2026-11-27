import { describe, expect, it, vi } from 'vitest';
import { ILike, IsNull, type Repository } from 'typeorm';
import { Product } from '../../entities/product.entity.js';
import { ProductType } from '../../enums/product-type.enum.js';
import { ListProductsHandler } from './list-products.handler.js';
import { ListProductsQuery } from './list-products.query.js';

describe('ListProductsHandler', () => {
  it('busca por nombre y tipo antes de contar y paginar, incluyendo no disponibles', async () => {
    const product = Object.assign(new Product(), {
      id: 'id',
      nombre: 'Lomo saltado',
      descripcion: null,
      precio: '28.00',
      tipo: ProductType.PLATO_FONDO,
      disponible: false,
      imageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const products = {
      count: vi.fn().mockResolvedValue(3),
      find: vi.fn().mockResolvedValue([product]),
    };
    const handler = new ListProductsHandler(
      products as unknown as Repository<Product>,
    );
    const result = await handler.execute(
      new ListProductsQuery(
        {
          page: 2,
          limit: 2,
          tipo: ProductType.PLATO_FONDO,
          nombre: 'LoMo',
        },
        true,
      ),
    );
    const where = {
      deletedAt: IsNull(),
      tipo: ProductType.PLATO_FONDO,
      nombre: ILike('%LoMo%'),
    };
    expect(products.count).toHaveBeenCalledWith({ where });
    expect(products.find).toHaveBeenCalledWith(
      expect.objectContaining({ where, skip: 2, take: 2 }),
    );
    expect(result).toMatchObject({
      total: 3,
      totalPages: 2,
      page: 2,
      items: [{ id: 'id', disponible: false }],
    });
    expect(result.items[0]).not.toHaveProperty('deletedAt');
    expect(result.items[0]).not.toHaveProperty('imageKey');
  });

  it('devuelve una página vacía cuando la búsqueda no coincide', async () => {
    const products = { count: vi.fn().mockResolvedValue(0), find: vi.fn() };
    const handler = new ListProductsHandler(
      products as unknown as Repository<Product>,
    );
    await expect(
      handler.execute(
        new ListProductsQuery(
          { page: 1, limit: 10, nombre: 'inexistente' },
          true,
        ),
      ),
    ).resolves.toEqual({
      items: [],
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    });
    expect(products.find).not.toHaveBeenCalled();
  });
});
