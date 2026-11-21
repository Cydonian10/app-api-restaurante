import { describe, expect, it, vi } from 'vitest';
import { IsNull, type Repository } from 'typeorm';
import { Product } from '../../entities/product.entity.js';
import { ProductType } from '../../enums/product-type.enum.js';
import type { ImageStorage } from '../../storage/image-storage.js';
import {
  DeleteProductCommand,
  UpdateProductCommand,
} from './manage-product.command.js';
import {
  DeleteProductHandler,
  UpdateProductHandler,
} from './manage-product.handler.js';

const data = { nombre: 'Sopa', precio: '12.50', tipo: ProductType.PLATO_FONDO };
const file = {
  buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  mimetype: 'image/png',
  size: 8,
};
describe('gestión de productos', () => {
  it('actualiza campos y reemplaza la imagen después de guardar', async () => {
    const products = {
      findOneBy: vi
        .fn()
        .mockResolvedValue({ imageKey: 'old', imageProvider: 'local' }),
      update: vi.fn().mockResolvedValue({ affected: 1 }),
    };
    const storage = {
      upload: vi
        .fn()
        .mockResolvedValue({ url: '/new', key: 'new', provider: 'local' }),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    const handler = new UpdateProductHandler(
      products as unknown as Repository<Product>,
      storage as ImageStorage,
    );
    await handler.execute(new UpdateProductCommand('id', data, file));
    expect(products.update).toHaveBeenCalledWith(
      { id: 'id', deletedAt: IsNull() },
      {
        ...data,
        descripcion: null,
        imageUrl: '/new',
        imageKey: 'new',
        imageProvider: 'local',
      },
    );
    expect(storage.delete).toHaveBeenCalledWith('old');
  });
  it('descarta la imagen nueva si falla el guardado', async () => {
    const products = {
      findOneBy: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockRejectedValue(new Error('falló')),
    };
    const storage = {
      upload: vi
        .fn()
        .mockResolvedValue({ url: '/new', key: 'new', provider: 'local' }),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    await expect(
      new UpdateProductHandler(
        products as unknown as Repository<Product>,
        storage as ImageStorage,
      ).execute(new UpdateProductCommand('id', data, file)),
    ).rejects.toThrow('falló');
    expect(storage.delete).toHaveBeenCalledWith('new');
  });
  it('rechaza modificaciones y bajas de productos inexistentes o dados de baja', async () => {
    const products = {
      findOneBy: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue({ affected: 0 }),
    };
    const storage = { upload: vi.fn(), delete: vi.fn() };
    await expect(
      new UpdateProductHandler(
        products as unknown as Repository<Product>,
        storage as ImageStorage,
      ).execute(new UpdateProductCommand('id', data)),
    ).rejects.toThrow('Producto no encontrado');
    await expect(
      new DeleteProductHandler(
        products as unknown as Repository<Product>,
      ).execute(new DeleteProductCommand('id')),
    ).rejects.toThrow('Producto no encontrado');
    expect(products.update).toHaveBeenCalledWith(
      { id: 'id', deletedAt: IsNull() },
      { deletedAt: expect.any(Date) },
    );
  });
});
