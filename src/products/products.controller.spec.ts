import { describe, expect, it, vi } from 'vitest';
import type { Repository } from 'typeorm';
import { createProductSchema } from './dtos/create-product.dto.js';
import { Product } from './entities/product.entity.js';
import { ProductType } from './enums/product-type.enum.js';
import { ProductsController } from './products.controller.js';
import type { ImageStorage } from './storage/image-storage.js';

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
    const controller = new ProductsController(
      products as unknown as Repository<Product>,
      storage as ImageStorage,
    );
    const file = {
      buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      mimetype: 'image/png',
      size: 8,
    };
    await expect(controller.create(valid, file)).rejects.toThrow('db error');
    expect(storage.delete).toHaveBeenCalledWith('image.png');
  });

  it('rechaza contenido que no coincide con el tipo declarado', async () => {
    const storage = { upload: vi.fn(), delete: vi.fn() };
    const controller = new ProductsController(
      {} as Repository<Product>,
      storage as ImageStorage,
    );
    await expect(
      controller.create(valid, {
        buffer: Buffer.from('no es png'),
        mimetype: 'image/png',
        size: 10,
      }),
    ).rejects.toThrow('La imagen debe ser');
    expect(storage.upload).not.toHaveBeenCalled();
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
      upload: vi
        .fn()
        .mockResolvedValue({
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
    const controller = new ProductsController(
      products as unknown as Repository<Product>,
      storage as ImageStorage,
    );
    await expect(controller.addImage('id', file)).resolves.toEqual({
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
    const controller = new ProductsController(
      products as unknown as Repository<Product>,
      storage as ImageStorage,
    );
    await expect(controller.addImage('id', file)).rejects.toThrow(
      'upload error',
    );
    expect(products.update).not.toHaveBeenCalled();
  });

  it('elimina la imagen subida si otra petición ya añadió una', async () => {
    const storage = {
      upload: vi
        .fn()
        .mockResolvedValue({
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
    const controller = new ProductsController(
      products as unknown as Repository<Product>,
      storage as ImageStorage,
    );
    await expect(controller.addImage('id', file)).rejects.toThrow(
      'ya tiene una imagen',
    );
    expect(storage.delete).toHaveBeenCalledWith('image.png');
  });
});
