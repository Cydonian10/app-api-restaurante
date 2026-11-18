import { PasswordHasher } from '@nestjs/authentication';
import { ConflictException } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import { User } from '../../../auth/entities/user.entity.js';
import { Person } from '../../entities/person.entity.js';
import { UserRole } from '../../enums/user-role.enum.js';
import { CreateUserCommand } from './create-user.command.js';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    private readonly db: DataSource,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute({ data }: CreateUserCommand): Promise<User> {
    const passwordHash = await this.hasher.hash(data.password);
    try {
      return await this.db.transaction(async (manager) => {
        const user = manager.create(User, {
          id: randomUUID(),
          email: data.email,
          role: UserRole.CLIENTE,
          passwordHash,
        });
        await manager.save(user);
        const person = manager.create(Person, {
          id: randomUUID(),
          userId: user.id,
          name: data.name,
          lastName: data.lastName ?? null,
          phone: data.phone ?? null,
          document: data.document ?? null,
          birthDate: data.birthDate ?? null,
          residence: data.residence ?? null,
        });
        await manager.save(person);
        user.person = person;
        return user;
      });
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === '23505' &&
        'constraint' in error &&
        error.constraint === 'UQ_users_email'
      ) {
        throw new ConflictException('El correo ya está registrado');
      }
      throw error;
    }
  }
}
