import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { commandFixture } from '../../../../test/orders-unit.fixture.js';
import { OrderItem } from '../../entities/order-item.entity.js';
import { MenuSelection } from '../../entities/menu-selection.entity.js';
import { CreateOrderCommand } from './create-order.command.js';
import { CreateOrderHandler } from './create-order.handler.js';

describe('CreateOrderHandler', () => {
  it('guarda una unidad PENDING por cantidad y selecciones independientes gratuitas', async () => {
    const fixture = commandFixture();
    const result = await new CreateOrderHandler(fixture.db).execute(
      new CreateOrderCommand('session', [
        {
          productId: 'product',
          quantity: 3,
          selections: [
            { extraProductId: 'extra' },
            { drinkProductId: 'drink' },
          ],
        },
      ]),
    );
    expect(result.items).toHaveLength(3);
    expect(new Set(result.items.map((item) => item.id)).size).toBe(3);
    for (const item of result.items)
      expect(item).toMatchObject({
        productName: 'Menú',
        unitPrice: '12.50',
        status: 'PENDING',
        deliveredAt: null,
        orderId: result.id,
      });
    expect(fixture.manager.save).toHaveBeenCalledWith(
      MenuSelection,
      expect.objectContaining({
        orderItemId: result.items[0].id,
        extraProductId: 'extra',
        drinkProductId: null,
      }),
    );
    expect(fixture.manager.save).toHaveBeenCalledWith(
      MenuSelection,
      expect.objectContaining({
        orderItemId: result.items[1].id,
        extraProductId: null,
        drinkProductId: 'drink',
      }),
    );
  });

  it.each([
    ['ausente', undefined, NotFoundException],
    ['cerrada', { closedAt: new Date() }, ConflictException],
  ])('rechaza atención %s sin escribir', async (_name, session, error) => {
    const fixture = commandFixture();
    fixture.sessionRepo.findOne.mockResolvedValue(session);
    await expect(
      new CreateOrderHandler(fixture.db).execute(
        new CreateOrderCommand('session', [
          { productId: 'product', quantity: 1 },
        ]),
      ),
    ).rejects.toBeInstanceOf(error);
    expect(fixture.manager.save).not.toHaveBeenCalled();
  });

  it.each(
    [
      [],
      [{ productId: 'product', quantity: 0 }],
      [{ productId: 'product', quantity: 1.5 }],
      [{ productId: 'missing', quantity: 1 }],
      [
        {
          productId: 'product',
          quantity: 1,
          selections: [{ extraProductId: 'drink' }],
        },
      ],
      [
        {
          productId: 'product',
          quantity: 1,
          selections: [{ drinkProductId: 'extra' }],
        },
      ],
      [{ productId: 'extra', quantity: 1, selections: [{}] }],
      [{ productId: 'product', quantity: 1, selections: [{}, {}] }],
    ].map((lines) => [lines]),
  )('rechaza líneas inválidas dentro de la transacción: %j', async (lines) => {
    const fixture = commandFixture();
    await expect(
      new CreateOrderHandler(fixture.db).execute(
        new CreateOrderCommand('session', lines as never),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(fixture.db.transaction).toHaveBeenCalledOnce();
    expect(
      fixture.manager.save.mock.calls.filter(
        ([entity]) => entity === OrderItem,
      ),
    ).toHaveLength(0);
  });
});
