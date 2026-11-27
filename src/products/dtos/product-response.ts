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

export function toProductResponse(product: Product): ProductResponse {
  return {
    id: product.id,
    nombre: product.nombre,
    descripcion: product.descripcion,
    precio: product.precio,
    tipo: product.tipo,
    principal: product.principal,
    disponible: product.disponible,
    imageUrl: product.imageUrl,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}
