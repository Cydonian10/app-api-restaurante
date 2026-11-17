import z from 'zod';

export const email = z
  .string()
  .trim()
  .normalize()
  .toLowerCase()
  .max(254)
  .pipe(z.email());
