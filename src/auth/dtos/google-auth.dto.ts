import { z } from 'zod';

export const googleCallbackSchema = z.object({
  code: z.string().min(1).max(4096),
  state: z.string().regex(/^[a-f0-9]{64}$/),
  iss: z.url().optional(),
});
export type GoogleCallbackDto = z.infer<typeof googleCallbackSchema>;
export const exchangeGoogleCodeSchema = z
  .object({ code: z.string().regex(/^[A-Za-z0-9_-]{43}$/) })
  .strict();
export type ExchangeGoogleCodeDto = z.infer<typeof exchangeGoogleCodeSchema>;
