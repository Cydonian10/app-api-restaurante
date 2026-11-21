import { z } from 'zod';

export const zoneSchema = z
  .object({ name: z.string().trim().min(1).max(120) })
  .strict();
export const tableSchema = z
  .object({
    zoneId: z.uuid(),
    number: z.number().int().positive(),
    capacity: z.number().int().positive(),
  })
  .strict();
export const updateTableSchema = z
  .object({
    number: z.number().int().positive().optional(),
    capacity: z.number().int().positive().optional(),
    outOfService: z.boolean().optional(),
    positionX: z.number().int().nonnegative().optional(),
    positionY: z.number().int().nonnegative().optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0);

export type ZoneDto = z.infer<typeof zoneSchema>;
export type CreateTableDto = z.infer<typeof tableSchema>;
export type UpdateTableDto = z.infer<typeof updateTableSchema>;
