import { describe, expect, it, vi } from 'vitest';
import { IsNull, type Repository } from 'typeorm';
import { createProductSchema } from './dtos/create-product.dto.js';
import { Product } from './entities/product.entity.js';
import { ProductType } from './enums/product-type.enum.js';
import { CreateProductHandler } from './commands/create-product/create-product.handler.js';
import { CreateProductCommand } from './commands/create-product/create-product.command.js';
import { AddProductImageHandler } from './commands/add-product-image/add-product-image.handler.js';
import { AddProductImageCommand } from './commands/add-product-image/add-product-image.command.js';
import { ListProductsHandler } from './queries/list-products/list-products.handler.js';
import { ListProductsQuery } from './queries/list-products/list-products.query.js';
import type { ImageStorage } from './storage/image-storage.js';
import { listProductsSchema } from './dtos/list-products.dto.js';

describe('crear productos', () => {
  const valid = {
    nombre: 'Menú',
    precio: '0.50',
    tipo: ProductType.PLATO_FONDO,
  };

  it('valida tipo, nombre y precisión decimal', () => {
    expect(createProductSchema.safeParse(valid).success).toBe(true);
    for (const precio of ['-1', '1.234', '', '10000000000']) {
      expect(createProductSchema.safeParse({ ...valid, precio }).success).toBe(
        false,
      );
    }
    expect(
      createProductSchema.safeParse({ ...valid, tipo: 'OTRO' }).success,
    ).toBe(false);
    expect(
      createProductSchema.safeParse({ ...valid, nombre: '  ' }).success,
    ).toBe(false);
  });

  it('elimina la imagen si falla el guardado', async () => {
    const storage = {
      upload: vi.fn().mockResolvedValue({
        provider: 'local',
        key: 'image.png',
        url: '/image.png',
      }),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    const products = {
      create: vi.fn().mockReturnValue({}),
      save: vi.fn().mockRejectedValue(new Error('db error')),
    };
    const controller = new CreateProductHandler(
      products as unknown as Repository<Product>,
      storage as ImageStorage,
    );
    const file = {
      buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      mimetype: 'image/png',
      size: 8,
    };
    await expect(
      controller.execute(new CreateProductCommand(valid, file)),
    ).rejects.toThrow('db error');
    expect(storage.delete).toHaveBeenCalledWith('image.png');
  });

  it('rechaza contenido que no coincide con el tipo declarado', async () => {
    const storage = { upload: vi.fn(), delete: vi.fn() };
    const controller = new CreateProductHandler(
      {} as Repository<Product>,
      storage as ImageStorage,
    );
    await expect(
      controller.execute(
        new CreateProductCommand(valid, {
          buffer: Buffer.from('no es png'),
          mimetype: 'image/png',
          size: 10,
        }),
      ),
    ).rejects.toThrow('La imagen debe ser');
    expect(storage.upload).not.toHaveBeenCalled();
  });
});

describe('listar productos', () => {
  it('valida paginación y tipo', () => {
    expect(listProductsSchema.parse({})).toEqual({ page: 1, limit: 10 });
    for (const query of [
      { page: '0' },
      { limit: '101' },
      { page: '1.5' },
      { tipo: 'OTRO' },
    ]) {
      expect(listProductsSchema.safeParse(query).success).toBe(false);
    }
  });

  it('filtra los productos públicos disponibles y aplica paginación y tipo', async () => {
    const products = {
      count: vi.fn().mockResolvedValue(12),
      find: vi.fn().mockResolvedValue([]),
    };
    const controller = new ListProductsHandler(
      products as unknown as Repository<Product>,
    );
    const query = { page: 2, limit: 5, tipo: ProductType.BEBIDA };
    await expect(
      controller.execute(new ListProductsQuery(query, false)),
    ).resolves.toEqual({
      items: [],
      page: 2,
      limit: 5,
      total: 12,
      totalPages: 3,
    });
    expect(products.count).toHaveBeenCalledWith({
      where: {
        deletedAt: IsNull(),
        disponible: true,
        tipo: ProductType.BEBIDA,
      },
    });
    expect(products.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          deletedAt: IsNull(),
          disponible: true,
          tipo: ProductType.BEBIDA,
        },
        skip: 5,
        take: 5,
      }),
    );
  });

  it('incluye productos no disponibles para administración y maneja páginas fuera de rango', async () => {
    const products = { count: vi.fn().mockResolvedValue(1), find: vi.fn() };
    const controller = new ListProductsHandler(
      products as unknown as Repository<Product>,
    );
    await expect(
      controller.execute(new ListProductsQuery({ page: 2, limit: 10 }, true)),
    ).resolves.toEqual({
      items: [],
      page: 2,
      limit: 10,
      total: 1,
      totalPages: 1,
    });
    expect(products.count).toHaveBeenCalledWith({
      where: { deletedAt: IsNull() },
    });
    expect(products.find).not.toHaveBeenCalled();
  });
});

describe('agregar imagen a producto', () => {
  const file = {
    buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    mimetype: 'image/png',
    size: 8,
  };

  it('guarda la referencia después de subir la imagen', async () => {
    const storage = {
      upload: vi.fn().mockResolvedValue({
        provider: 'local',
        key: 'image.png',
        url: '/image.png',
      }),
      delete: vi.fn(),
    };
    const products = {
      findOneBy: vi.fn().mockResolvedValue({ imageUrl: null }),
      update: vi.fn().mockResolvedValue({ affected: 1 }),
    };
    const controller = new AddProductImageHandler(
      products as unknown as Repository<Product>,
      storage as ImageStorage,
    );
    await expect(
      controller.execute(new AddProductImageCommand('id', file)),
    ).resolves.toEqual({
      id: 'id',
      imageUrl: '/image.png',
    });
    expect(products.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'id' }),
      { imageUrl: '/image.png', imageProvider: 'local', imageKey: 'image.png' },
    );
  });

  it('no cambia la referencia si falla la subida', async () => {
    const storage = {
      upload: vi.fn().mockRejectedValue(new Error('upload error')),
      delete: vi.fn(),
    };
    const products = {
      findOneBy: vi.fn().mockResolvedValue({ imageUrl: null }),
      update: vi.fn(),
    };
    const controller = new AddProductImageHandler(
      products as unknown as Repository<Product>,
      storage as ImageStorage,
    );
    await expect(
      controller.execute(new AddProductImageCommand('id', file)),
    ).rejects.toThrow('upload error');
    expect(products.update).not.toHaveBeenCalled();
  });

  it('elimina la imagen subida si otra petición ya añadió una', async () => {
    const storage = {
      upload: vi.fn().mockResolvedValue({
        provider: 'local',
        key: 'image.png',
        url: '/image.png',
      }),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    const products = {
      findOneBy: vi.fn().mockResolvedValue({ imageUrl: null }),
      update: vi.fn().mockResolvedValue({ affected: 0 }),
    };
    const controller = new AddProductImageHandler(
      products as unknown as Repository<Product>,
      storage as ImageStorage,
    );
    await expect(
      controller.execute(new AddProductImageCommand('id', file)),
    ).rejects.toThrow('ya tiene una imagen');
    expect(storage.delete).toHaveBeenCalledWith('image.png');
  });
});
