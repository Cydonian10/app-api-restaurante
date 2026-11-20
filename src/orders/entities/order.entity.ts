import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { TableSession } from '../../dining/entities/table-session.entity.js';
import { OrderItem } from './order-item.entity.js';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'table_session_id', type: 'uuid' })
  tableSessionId: string;

  @ManyToOne(() => TableSession, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'table_session_id' })
  tableSession: Relation<TableSession>;

  @OneToMany(() => OrderItem, (item) => item.order)
  items: Relation<OrderItem[]>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
