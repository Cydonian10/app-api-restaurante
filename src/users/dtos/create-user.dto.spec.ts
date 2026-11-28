import { describe, expect, it } from 'vitest';
import { registerSchema } from '../../auth/dtos/register.dto.js';
import { UserRole } from '../enums/user-role.enum.js';
import { createUserSchema } from './create-user.dto.js';

const data = { name: 'Ana', email: 'ana@example.com', password: 'password123' };

describe('createUserSchema', () => {
  it.each(Object.values(UserRole))('accepts role %s', (role) => {
    expect(createUserSchema.parse({ ...data, role }).role).toBe(role);
  });

  it('accepts omitted roles for compatibility', () => {
    expect(createUserSchema.safeParse(data).success).toBe(true);
  });

  it.each(['INVALID', '', null])('rejects invalid role %s', (role) => {
    expect(createUserSchema.safeParse({ ...data, role }).success).toBe(false);
  });

  it('keeps privileged roles out of public registration', () => {
    expect(registerSchema.parse({ ...data, role: UserRole.ADMIN })).toEqual(
      data,
    );
  });
});
