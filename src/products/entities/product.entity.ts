import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductType } from '../enums/product-type.enum.js';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  precio: string;

  @Column({ type: 'enum', enum: ProductType, enumName: 'product_type_enum' })
  tipo: ProductType;

  @Column({ default: true })
  disponible: boolean;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl: string | null;

  @Column({ name: 'image_provider', type: 'varchar', nullable: true })
  imageProvider: string | null;

  @Column({ name: 'image_key', type: 'text', nullable: true })
  imageKey: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  get principal(): boolean {
    return this.tipo === ProductType.PLATO_FONDO;
  }
}
