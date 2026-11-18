import { describe, expect, it, vi } from 'vitest';
import { CreateUserCommand } from '../../../users/commands/create-user/create-user.command.js';
import { UserRole } from '../../../users/enums/user-role.enum.js';
import { RegisterCommand } from './register.command.js';
import { RegisterHandler } from './register.handler.js';

describe('RegisterHandler', () => {
  it('creates through the user command, sends verification and returns the person profile', async () => {
    const user = {
      id: 'user-id',
      email: 'ana@example.com',
      role: UserRole.CLIENTE,
      emailVerified: false,
      createdAt: new Date('2025-01-01'),
      passwordHash: 'secret-hash',
      person: {
        id: 'person-id',
        name: 'Ana',
        lastName: 'Pérez',
        phone: '123',
        document: null,
        birthDate: null,
        residence: 'Lima',
      },
    };
    const commands = { execute: vi.fn().mockResolvedValue(user) };
    const verification = { send: vi.fn().mockResolvedValue(undefined) };
    const handler = new RegisterHandler(
      commands as never,
      verification as never,
    );
    const data = { name: 'Ana', email: user.email, password: 'password123' };
    const result = await handler.execute(new RegisterCommand(data));
    expect(commands.execute).toHaveBeenCalledWith(
      expect.any(CreateUserCommand),
    );
    expect(commands.execute.mock.calls[0][0].data).toEqual(data);
    expect(verification.send).toHaveBeenCalledWith(user);
    expect(result).toMatchObject({
      name: 'Ana Pérez',
      person: user.person,
      email: user.email,
    });
    expect(result).not.toHaveProperty('passwordHash');
  });
});
