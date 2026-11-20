import z from 'zod';
import { ProductType } from '../enums/product-type.enum.js';

export const createProductSchema = z
  .object({
    nombre: z.string().trim().min(1).max(255),
    descripcion: z.string().trim().min(1).optional(),
    precio: z.string().regex(/^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/),
    tipo: z.enum(ProductType),
  })
  .strict();

export type CreateProductDto = z.infer<typeof createProductSchema>;
