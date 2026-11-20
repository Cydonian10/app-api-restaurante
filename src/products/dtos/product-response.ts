import type { Product } from '../entities/product.entity.js';
export type ProductResponse = Pick<
  Product,
  | 'id'
  | 'nombre'
  | 'descripcion'
  | 'precio'
  | 'tipo'
  | 'principal'
  | 'disponible'
  | 'imageUrl'
  | 'createdAt'
  | 'updatedAt'
>;
