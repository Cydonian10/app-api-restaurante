import { ConflictException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { User } from '../../../auth/entities/user.entity.js';
import { Person } from '../../entities/person.entity.js';
import { UserRole } from '../../enums/user-role.enum.js';
import { CreateUserCommand } from './create-user.command.js';
import { CreateUserHandler } from './create-user.handler.js';

const data = { name: 'Ana', email: 'ana@example.com', password: 'password123' };

function setup() {
  const manager = {
    create: vi.fn((_entity: unknown, value: object) => value),
    save: vi.fn().mockResolvedValue(undefined),
  };
  const db = {
    transaction: vi.fn(async (work: (m: typeof manager) => unknown) =>
      work(manager),
    ),
  };
  const hasher = { hash: vi.fn().mockResolvedValue('hashed-password') };
  return {
    manager,
    db,
    hasher,
    handler: new CreateUserHandler(db as never, hasher as never),
  };
}

describe('CreateUserHandler', () => {
  it.each(Object.values(UserRole))(
    'persists role %s with the person in one transaction',
    async (role) => {
      const { handler, manager, db, hasher } = setup();
      const input = {
        ...data,
        role,
        lastName: 'Pérez',
        phone: '123',
        document: '456',
        birthDate: '2000-01-01',
        residence: 'Lima',
      };
      const user = await handler.execute(new CreateUserCommand(input));
      expect(user.role).toBe(role);
      expect(hasher.hash).toHaveBeenCalledWith(data.password);
      expect(db.transaction).toHaveBeenCalledOnce();
      expect(manager.create).toHaveBeenCalledWith(
        User,
        expect.objectContaining({
          email: data.email,
          role,
          passwordHash: 'hashed-password',
        }),
      );
      expect(manager.create).toHaveBeenCalledWith(
        Person,
        expect.objectContaining({
          userId: user.id,
          name: data.name,
          lastName: input.lastName,
          phone: input.phone,
          document: input.document,
          birthDate: input.birthDate,
          residence: input.residence,
        }),
      );
      expect(manager.save).toHaveBeenNthCalledWith(1, user);
      expect(manager.save).toHaveBeenNthCalledWith(2, user.person);
      expect(user).not.toHaveProperty('password');
    },
  );

  it('defaults to CLIENTE and permits missing personal fields', async () => {
    const { handler } = setup();
    const user = await handler.execute(new CreateUserCommand(data));
    expect(user.role).toBe(UserRole.CLIENTE);
    expect(user.person).toMatchObject({
      name: data.name,
      lastName: null,
      phone: null,
      document: null,
      birthDate: null,
      residence: null,
    });
  });

  it('reports a duplicate email as a conflict', async () => {
    const { handler, db } = setup();
    db.transaction.mockRejectedValue({
      code: '23505',
      constraint: 'UQ_users_email',
    });
    await expect(handler.execute(new CreateUserCommand(data))).rejects.toThrow(
      ConflictException,
    );
  });

  it('propagates failures while saving the person', async () => {
    const { handler, manager } = setup();
    const failure = new Error('person save failed');
    manager.save
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(failure);
    await expect(handler.execute(new CreateUserCommand(data))).rejects.toBe(
      failure,
    );
  });
});
