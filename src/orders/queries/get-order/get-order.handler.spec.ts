import { NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { queryFixture } from '../../../../test/orders-unit.fixture.js';
import { GetOrderHandler } from './get-order.handler.js';
import { GetOrderQuery } from './get-order.query.js';

describe('GetOrderHandler', () => {
  it('devuelve el detalle con ítems y selecciones', async () => {
    const fixture = queryFixture();
    const order = {
      id: 'order',
      items: [
        {
          productName: 'Menú',
          unitPrice: '12.50',
          status: 'PENDING',
          menuSelection: { extraProductId: 'extra' },
        },
      ],
    };
    fixture.builder.getOne.mockResolvedValue(order);
    expect(
      await new GetOrderHandler(fixture.db).execute(new GetOrderQuery('order')),
    ).toEqual(order);
  });
  it('responde 404 para una orden inexistente', async () => {
    const fixture = queryFixture();
    fixture.builder.getOne.mockResolvedValue(null);
    await expect(
      new GetOrderHandler(fixture.db).execute(new GetOrderQuery('missing')),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
