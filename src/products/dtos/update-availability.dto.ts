import { z } from 'zod';

export const updateAvailabilitySchema = z
  .object({ disponible: z.boolean() })
  .strict();
export type UpdateAvailabilityDto = z.infer<typeof updateAvailabilitySchema>;
