import z from 'zod';
import { registerSchema } from '../../auth/dtos/register.dto.js';

export const createUserSchema = registerSchema.extend({
  lastName: z.string().trim().min(1).max(120).optional(),
  phone: z.string().trim().min(1).max(30).optional(),
  document: z.string().trim().min(1).max(50).optional(),
  birthDate: z.iso.date().optional(),
  residence: z.string().trim().min(1).max(200).optional(),
});
export type CreateUserDto = z.infer<typeof createUserSchema>;
