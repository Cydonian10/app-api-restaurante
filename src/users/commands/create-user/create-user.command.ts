import { Command } from '@nestjs/cqrs';
import type { User } from '../../../auth/entities/user.entity.js';
import type { CreateUserDto } from '../../dtos/create-user.dto.js';

export class CreateUserCommand extends Command<User> {
  constructor(public readonly data: CreateUserDto) {
    super();
  }
}
