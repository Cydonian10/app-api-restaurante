import { NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { queryFixture } from '../../../../test/orders-unit.fixture.js';
import { ListOrdersHandler } from './list-orders.handler.js';
import { ListOrdersQuery } from './list-orders.query.js';

describe('ListOrdersHandler', () => {
  it.each([null, new Date()])(
    'lista órdenes incluso con closedAt=%s',
    async (closedAt) => {
      const fixture = queryFixture();
      fixture.repository.findOneBy.mockResolvedValue({
        id: 'session',
        closedAt,
      });
      const orders = [{ id: 'order', items: [{ menuSelection: null }] }];
      fixture.builder.getMany.mockResolvedValue(orders);
      expect(
        await new ListOrdersHandler(fixture.db).execute(
          new ListOrdersQuery('session'),
        ),
      ).toEqual(orders);
    },
  );
  it('devuelve una lista vacía cuando la atención todavía no tiene órdenes', async () => {
    const fixture = queryFixture();
    fixture.repository.findOneBy.mockResolvedValue({
      id: 'session',
      closedAt: null,
    });
    fixture.builder.getMany.mockResolvedValue([]);
    expect(
      await new ListOrdersHandler(fixture.db).execute(
        new ListOrdersQuery('session'),
      ),
    ).toEqual([]);
  });
  it('responde 404 cuando la atención no existe', async () => {
    const fixture = queryFixture();
    fixture.repository.findOneBy.mockResolvedValue(null);
    await expect(
      new ListOrdersHandler(fixture.db).execute(new ListOrdersQuery('missing')),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
