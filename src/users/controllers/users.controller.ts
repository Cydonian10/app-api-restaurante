import { Authenticate } from '@nestjs/authentication';
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { PublicUser } from '../../auth/dtos/public-user.dto.js';
import { JwtAuthProvider } from '../../auth/providers/jwt-auth.provider.js';
import { CreateUserCommand } from '../commands/create-user/create-user.command.js';
import {
  createUserSchema,
  type CreateUserDto,
} from '../dtos/create-user.dto.js';
import {
  DEFAULT_USERS_LIMIT,
  DEFAULT_USERS_PAGE,
  ListUsersResponseDto,
  listUsersSchema,
  MAX_USERS_LIMIT,
  type ListUsersDto,
} from '../dtos/list-users.dto.js';
import { UserRole } from '../enums/user-role.enum.js';
import { ListUsersAdminGuard } from '../guards/list-users-admin.guard.js';
import { ListUsersQuery } from '../queries/list-users/list-users.query.js';

@ApiTags('Usuarios')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    private readonly commands: CommandBus,
    private readonly queries: QueryBus,
  ) {}

  @Get()
  @Authenticate({ providers: [JwtAuthProvider] })
  @UseGuards(ListUsersAdminGuard)
  @ApiOperation({ summary: 'Listar usuarios (solo administradores)' })
  @ApiQuery({
    name: 'page',
    required: false,
    schema: { type: 'integer', minimum: 1, default: DEFAULT_USERS_PAGE },
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    schema: {
      type: 'integer',
      minimum: 1,
      maximum: MAX_USERS_LIMIT,
      default: DEFAULT_USERS_LIMIT,
    },
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description:
      'Busca por nombre, apellido, nombre completo o correo, sin distinguir mayúsculas.',
  })
  @ApiQuery({ name: 'role', enum: UserRole, required: false })
  @ApiQuery({ name: 'emailVerified', type: Boolean, required: false })
  @ApiOkResponse({
    type: ListUsersResponseDto,
    description: 'Página de usuarios. Fuera de rango, items está vacío.',
  })
  @ApiBadRequestResponse({ description: 'Parámetros de consulta inválidos.' })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido.' })
  @ApiForbiddenResponse({ description: 'Se requiere el rol ADMIN.' })
  list(@Query({ schema: listUsersSchema }) query: ListUsersDto) {
    return this.queries.execute(new ListUsersQuery(query));
  }

  @Post()
  @Authenticate({ providers: [JwtAuthProvider] })
  @UseGuards(ListUsersAdminGuard)
  @ApiOperation({
    summary: 'Crear un usuario con sus datos personales (solo administradores)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'email', 'password'],
      properties: {
        name: { type: 'string', minLength: 1, maxLength: 120 },
        email: { type: 'string', format: 'email' },
        password: {
          type: 'string',
          format: 'password',
          minLength: 8,
          maxLength: 128,
        },
        lastName: { type: 'string', minLength: 1, maxLength: 120 },
        phone: { type: 'string', minLength: 1, maxLength: 30 },
        document: { type: 'string', minLength: 1, maxLength: 50 },
        birthDate: { type: 'string', format: 'date' },
        residence: { type: 'string', minLength: 1, maxLength: 200 },
        role: {
          type: 'string',
          enum: Object.values(UserRole),
          default: UserRole.CLIENTE,
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Datos de usuario inválidos.' })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido.' })
  @ApiForbiddenResponse({ description: 'Se requiere el rol ADMIN.' })
  async create(@Body({ schema: createUserSchema }) body: CreateUserDto) {
    const user = await this.commands.execute(new CreateUserCommand(body));
    return PublicUser.toDto(user);
  }
}
