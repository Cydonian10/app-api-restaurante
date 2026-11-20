import { z } from 'zod';
import { ProductType } from '../enums/product-type.enum.js';

const positiveInteger = (max: number) =>
  z
    .string()
    .regex(/^[0-9]+$/)
    .transform(Number)
    .pipe(z.int().min(1).max(max));

export const listProductsSchema = z.object({
  page: positiveInteger(Number.MAX_SAFE_INTEGER).default(1),
  limit: positiveInteger(100).default(10),
  tipo: z.enum(ProductType).optional(),
});

export type ListProductsDto = z.infer<typeof listProductsSchema>;
