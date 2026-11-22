import { vi } from 'vitest';
import { DataSource } from 'typeorm';
import { Product } from '../src/products/entities/product.entity.js';
import { ProductType } from '../src/products/enums/product-type.enum.js';
import { TableSession } from '../src/dining/entities/table-session.entity.js';

export function commandFixture() {
  const products = new Map([
    [
      'product',
      {
        id: 'product',
        nombre: 'Menú',
        precio: '12.50',
        tipo: ProductType.MENU,
      },
    ],
    [
      'extra',
      { id: 'extra', nombre: 'Extra', precio: '5.00', tipo: ProductType.EXTRA },
    ],
    [
      'drink',
      {
        id: 'drink',
        nombre: 'Bebida',
        precio: '3.00',
        tipo: ProductType.BEBIDA_MENU,
      },
    ],
  ]);
  const session = { id: 'session', closedAt: null as Date | null };
  const sessionRepo = {
    findOne: vi.fn().mockImplementation(async () => session),
  };
  const productRepo = {
    findOne: vi
      .fn()
      .mockImplementation(async ({ where }) => products.get(where.id)),
  };
  let sequence = 0;
  const manager = {
    getRepository: vi.fn((entity) =>
      entity === TableSession
        ? sessionRepo
        : entity === Product
          ? productRepo
          : undefined,
    ),
    findOneBy: vi
      .fn()
      .mockResolvedValue({ id: 'order', tableSessionId: 'session' }),
    save: vi.fn(async (_entity, value) => ({
      id: `saved-${++sequence}`,
      ...value,
    })),
  };
  const db = { transaction: vi.fn(async (action) => action(manager)) };
  return {
    db: db as unknown as DataSource,
    manager,
    session,
    sessionRepo,
    productRepo,
    products,
  };
}

export function queryFixture() {
  const builder = {
    leftJoinAndSelect: vi.fn().mockReturnThis(),
    leftJoinAndMapOne: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    addOrderBy: vi.fn().mockReturnThis(),
    getOne: vi.fn(),
    getMany: vi.fn(),
  };
  const repository = {
    createQueryBuilder: vi.fn(() => builder),
    findOneBy: vi.fn(),
  };
  const db = { getRepository: vi.fn(() => repository) };
  return { db: db as unknown as DataSource, builder, repository };
}
