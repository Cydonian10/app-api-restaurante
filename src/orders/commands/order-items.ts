import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { IsNull, type EntityManager } from 'typeorm';
import { TableSession } from '../../dining/entities/table-session.entity.js';
import { Product } from '../../products/entities/product.entity.js';
import { ProductType } from '../../products/enums/product-type.enum.js';
import { OrderItem } from '../entities/order-item.entity.js';
import { MenuSelection } from '../entities/menu-selection.entity.js';
import { OrderItemStatus } from '../enums/order-item-status.enum.js';

export interface OrderLine {
  productId: string;
  quantity: number;
  selections?: { extraProductId?: string; drinkProductId?: string }[];
}

export async function lockOpenSession(manager: EntityManager, id: string) {
  const session = await manager.getRepository(TableSession).findOne({
    where: { id },
    lock: { mode: 'pessimistic_write' },
  });
  if (!session) throw new NotFoundException('Atención no encontrada');
  if (session.closedAt) throw new ConflictException('La atención está cerrada');
  return session;
}

export async function saveOrderItems(
  manager: EntityManager,
  orderId: string,
  lines: OrderLine[],
) {
  if (!Array.isArray(lines) || lines.length === 0)
    throw new BadRequestException('La orden requiere ítems');
  const productRepo = manager.getRepository(Product);
  const getProduct = async (id: string, type?: ProductType) => {
    const product = await productRepo.findOne({
      where: { id, disponible: true, deletedAt: IsNull() },
    });
    if (!product || (type && product.tipo !== type))
      throw new BadRequestException('Producto o selección inválida');
    return product;
  };
  const items: OrderItem[] = [];
  for (const line of lines) {
    if (
      !Number.isSafeInteger(line.quantity) ||
      line.quantity < 1 ||
      !line.productId ||
      (line.selections !== undefined &&
        (!Array.isArray(line.selections) ||
          line.selections.length > line.quantity))
    )
      throw new BadRequestException('Cantidad o selecciones inválidas');
    const product = await getProduct(line.productId);
    if (line.selections?.length && product.tipo !== ProductType.MENU)
      throw new BadRequestException('Las selecciones requieren un menú');
    for (let i = 0; i < line.quantity; i++) {
      const selection = line.selections?.[i];
      if (selection?.extraProductId)
        await getProduct(selection.extraProductId, ProductType.EXTRA);
      if (selection?.drinkProductId)
        await getProduct(selection.drinkProductId, ProductType.BEBIDA_MENU);
      const item = await manager.save(OrderItem, {
        orderId,
        productId: product.id,
        productName: product.nombre,
        unitPrice: product.precio,
        status: OrderItemStatus.PENDING,
        deliveredAt: null,
      });
      if (selection?.extraProductId || selection?.drinkProductId) {
        await manager.save(MenuSelection, {
          orderItemId: item.id,
          extraProductId: selection.extraProductId ?? null,
          drinkProductId: selection.drinkProductId ?? null,
        });
      }
      items.push(item);
    }
  }
  return items;
}
