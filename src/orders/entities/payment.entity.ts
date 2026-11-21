import {
  Check,
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { TableSession } from '../../dining/entities/table-session.entity.js';
import { PaymentMethod } from '../enums/payment-method.enum.js';

@Entity('payments')
@Check('chk_payments_amount_positive', '"amount" > 0')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'table_session_id', type: 'uuid', unique: true })
  tableSessionId: string;

  @OneToOne(() => TableSession, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'table_session_id' })
  tableSession: Relation<TableSession>;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: string;

  @Column({ type: 'enum', enum: PaymentMethod, enumName: 'payment_method_enum' })
  method: PaymentMethod;

  @Column({ name: 'paid_at', type: 'timestamptz' })
  paidAt: Date;
}
