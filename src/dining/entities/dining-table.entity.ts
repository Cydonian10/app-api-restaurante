import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
  type Relation,
} from 'typeorm';
import { Zone } from './zone.entity.js';
import { TableSession } from './table-session.entity.js';

@Entity('dining_tables')
@Unique('uq_dining_tables_zone_number', ['zoneId', 'number'])
@Check('chk_dining_tables_number_positive', '"number" > 0')
@Check('chk_dining_tables_capacity_positive', '"capacity" > 0')
export class DiningTable {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'zone_id', type: 'uuid', update: false })
  zoneId: string;

  @ManyToOne(() => Zone, (zone) => zone.tables, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'zone_id' })
  zone: Relation<Zone>;

  @Column({ type: 'integer' })
  number: number;

  @Column({ type: 'integer' })
  capacity: number;

  @Column({ default: true })
  active: boolean;

  @Column({ name: 'out_of_service', default: false })
  outOfService: boolean;

  @OneToMany(() => TableSession, (session) => session.table)
  sessions: Relation<TableSession[]>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
