import {
  EmailVerificationService,
  PasswordHasher,
} from '@nestjs/authentication';
import { ConflictException, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity.js';
import { PublicUser } from '../../dtos/public-user.dto.js';
import { RegisterCommand } from './register.command.js';

@CommandHandler(RegisterCommand)
export class RegisterHandler implements ICommandHandler<RegisterCommand> {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly hasher: PasswordHasher,
    private readonly verification: EmailVerificationService,
  ) {}
  async execute({ data }: RegisterCommand) {
    const user = this.users.create({
      id: randomUUID(),
      name: data.name,
      email: data.email,
      passwordHash: await this.hasher.hash(data.password),
    });
    try {
      await this.users.save(user);
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException('El correo ya está registrado');
      }
      throw error;
    }
    try {
      await this.verification.send(user);
    } catch (error) {
      new Logger(RegisterHandler.name).error(
        'No se pudo enviar el enlace de verificación',
        error instanceof Error ? error.message : undefined,
      );
    }
    return PublicUser.toDto(user);
  }
}
