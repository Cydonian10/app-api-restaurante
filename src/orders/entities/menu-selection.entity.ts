import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity.js';
import { OrderItem } from './order-item.entity.js';

@Entity('menu_selections')
export class MenuSelection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_item_id', type: 'uuid', unique: true })
  orderItemId: string;

  @OneToOne(() => OrderItem, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'order_item_id' })
  orderItem: Relation<OrderItem>;

  @Column({ name: 'extra_product_id', type: 'uuid', nullable: true })
  extraProductId: string | null;

  @ManyToOne(() => Product, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'extra_product_id' })
  extraProduct: Relation<Product> | null;

  @Column({ name: 'drink_product_id', type: 'uuid', nullable: true })
  drinkProductId: string | null;

  @ManyToOne(() => Product, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'drink_product_id' })
  drinkProduct: Relation<Product> | null;
}
