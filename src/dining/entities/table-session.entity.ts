import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  type Relation,
} from 'typeorm';
import { DiningTable } from './dining-table.entity.js';

@Entity('table_sessions')
@Index('uq_table_sessions_open_table', ['tableId'], {
  unique: true,
  where: '"closed_at" IS NULL',
})
@Check('chk_table_sessions_party_size_positive', '"party_size" > 0')
@Check(
  'chk_table_sessions_close_after_open',
  '"closed_at" IS NULL OR "closed_at" >= "opened_at"',
)
export class TableSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'table_id', type: 'uuid' })
  tableId: string;

  @ManyToOne(() => DiningTable, (table) => table.sessions, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'table_id' })
  table: Relation<DiningTable>;

  @Column({ name: 'party_size', type: 'integer' })
  partySize: number;

  @Column({ name: 'opened_at', type: 'timestamptz', default: () => 'now()' })
  openedAt: Date;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
