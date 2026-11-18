import { Body, Controller, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PublicUser } from '../../auth/dtos/public-user.dto.js';
import { CreateUserCommand } from '../commands/create-user/create-user.command.js';
import {
  createUserSchema,
  type CreateUserDto,
} from '../dtos/create-user.dto.js';

@ApiTags('Usuarios')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly commands: CommandBus) {}

  @Post()
  @ApiOperation({ summary: 'Crear un usuario con sus datos personales' })
  async create(@Body({ schema: createUserSchema }) body: CreateUserDto) {
    const user = await this.commands.execute(new CreateUserCommand(body));
    return PublicUser.toDto(user);
  }
}
