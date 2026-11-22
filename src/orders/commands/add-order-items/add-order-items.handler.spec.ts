import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { commandFixture } from '../../../../test/orders-unit.fixture.js';
import { AddOrderItemsCommand } from './add-order-items.command.js';
import { AddOrderItemsHandler } from './add-order-items.handler.js';

describe('AddOrderItemsHandler', () => {
  it('agrega unidades a la orden conservando el precio actual del catálogo', async () => {
    const fixture = commandFixture();
    const result = await new AddOrderItemsHandler(fixture.db).execute(
      new AddOrderItemsCommand('order', [
        { productId: 'product', quantity: 2 },
      ]),
    );
    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          orderId: 'order',
          productName: 'Menú',
          unitPrice: '12.50',
          status: 'PENDING',
        }),
      ]),
    );
  });

  it('responde 404 sin escribir cuando la orden no existe', async () => {
    const fixture = commandFixture();
    fixture.manager.findOneBy.mockResolvedValue(null);
    await expect(
      new AddOrderItemsHandler(fixture.db).execute(
        new AddOrderItemsCommand('missing', []),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(fixture.manager.save).not.toHaveBeenCalled();
  });

  it('responde 409 sin escribir cuando la atención está cerrada', async () => {
    const fixture = commandFixture();
    fixture.session.closedAt = new Date();
    await expect(
      new AddOrderItemsHandler(fixture.db).execute(
        new AddOrderItemsCommand('order', [
          { productId: 'product', quantity: 1 },
        ]),
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(fixture.manager.save).not.toHaveBeenCalled();
  });

  it('rechaza productos no elegibles', async () => {
    const fixture = commandFixture();
    await expect(
      new AddOrderItemsHandler(fixture.db).execute(
        new AddOrderItemsCommand('order', [
          { productId: 'missing', quantity: 1 },
        ]),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(fixture.manager.save).not.toHaveBeenCalled();
  });
});
