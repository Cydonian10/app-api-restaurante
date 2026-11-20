import { describe, expect, it, vi } from 'vitest';
import type { Repository } from 'typeorm';
import { Product } from '../../entities/product.entity.js';
import { updateAvailabilitySchema } from '../../dtos/update-availability.dto.js';
import { UpdateAvailabilityCommand } from './update-availability.command.js';
import { UpdateAvailabilityHandler } from './update-availability.handler.js';

describe('cambiar disponibilidad', () => {
  it('acepta solo un booleano explícito', () => {
    expect(
      updateAvailabilitySchema.safeParse({ disponible: false }).success,
    ).toBe(true);
    expect(
      updateAvailabilitySchema.safeParse({ disponible: 'false' }).success,
    ).toBe(false);
    expect(updateAvailabilitySchema.safeParse({}).success).toBe(false);
  });

  it('actualiza y devuelve la disponibilidad solicitada', async () => {
    const products = { update: vi.fn().mockResolvedValue({ affected: 1 }) };
    const handler = new UpdateAvailabilityHandler(
      products as unknown as Repository<Product>,
    );
    await expect(
      handler.execute(new UpdateAvailabilityCommand('id', false)),
    ).resolves.toEqual({ id: 'id', disponible: false });
    expect(products.update).toHaveBeenCalledWith(
      { id: 'id' },
      { disponible: false },
    );
  });

  it('rechaza un producto inexistente', async () => {
    const products = { update: vi.fn().mockResolvedValue({ affected: 0 }) };
    const handler = new UpdateAvailabilityHandler(
      products as unknown as Repository<Product>,
    );
    await expect(
      handler.execute(new UpdateAvailabilityCommand('id', true)),
    ).rejects.toThrow('Producto no encontrado');
  });
});
