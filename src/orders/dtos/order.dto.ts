import { z } from 'zod';

const selectionSchema = z
  .object({
    extraProductId: z.uuid().optional(),
    drinkProductId: z.uuid().optional(),
  })
  .strict();

const lineSchema = z
  .object({
    productId: z.uuid(),
    quantity: z.number().int().positive().safe(),
    selections: z.array(selectionSchema).optional(),
  })
  .strict()
  .refine(
    (line) => !line.selections || line.selections.length <= line.quantity,
    {
      message: 'No puede haber más selecciones que unidades',
      path: ['selections'],
    },
  );

export const orderItemsSchema = z
  .object({ items: z.array(lineSchema).min(1) })
  .strict();
export type OrderItemsDto = z.infer<typeof orderItemsSchema>;
