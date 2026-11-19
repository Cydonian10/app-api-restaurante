import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { UserRole } from '../enums/user-role.enum.js';

export const DEFAULT_USERS_PAGE = 1;
export const DEFAULT_USERS_LIMIT = 10;
export const MAX_USERS_LIMIT = 100;

const positiveInteger = (max: number) =>
  z
    .string()
    .regex(/^[0-9]+$/)
    .transform(Number)
    .pipe(z.int().min(1).max(max));

export const listUsersSchema = z.object({
  page: positiveInteger(Number.MAX_SAFE_INTEGER).default(DEFAULT_USERS_PAGE),
  limit: positiveInteger(MAX_USERS_LIMIT).default(DEFAULT_USERS_LIMIT),
  search: z.string().trim().optional(),
  role: z.enum(UserRole).optional(),
  emailVerified: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
});

export type ListUsersDto = z.infer<typeof listUsersSchema>;

export class ListedUserDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'email' })
  email: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty()
  emailVerified: boolean;

  @ApiProperty({
    type: 'object',
    nullable: true,
    required: ['name', 'lastName', 'phone'],
    properties: {
      name: { type: 'string' },
      lastName: { type: 'string', nullable: true },
      phone: { type: 'string', nullable: true },
    },
  })
  person: {
    name: string;
    lastName: string | null;
    phone: string | null;
  } | null;
}

export class ListUsersResponseDto {
  @ApiProperty({ type: [ListedUserDto] })
  items: ListedUserDto[];

  @ApiProperty({ type: 'integer', minimum: 1 })
  page: number;

  @ApiProperty({ type: 'integer', minimum: 1, maximum: MAX_USERS_LIMIT })
  limit: number;

  @ApiProperty({ type: 'integer', minimum: 0 })
  total: number;

  @ApiProperty({ type: 'integer', minimum: 0 })
  totalPages: number;
}
