import { AuthenticationContext, Public } from '@nestjs/authentication';
import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { User } from '../entities/user.entity.js';

import { LoginCommand } from '../commands/login/login.command.js';
import { RegisterCommand } from '../commands/register/register.command.js';
import { type RegisterDto, registerSchema } from '../dtos/register.dto.js';
import { type LoginDto, loginSchema } from '../dtos/login.dto.js';
import { PublicUser } from '../dtos/public-user.dto.js';

@ApiTags('Autenticación y usuarios')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly commands: CommandBus,
    private readonly context: AuthenticationContext<User>,
  ) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Crear un usuario' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'email', 'password'],
      properties: {
        name: {
          type: 'string',
          minLength: 1,
          maxLength: 120,
          example: 'Ana Pérez',
        },
        email: { type: 'string', format: 'email', example: 'ana@example.com' },
        password: {
          type: 'string',
          format: 'password',
          minLength: 8,
          maxLength: 128,
          example: 'clave-segura-123',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Usuario creado; no incluye la contraseña.',
  })
  @ApiConflictResponse({ description: 'El correo ya está registrado.' })
  register(@Body({ schema: registerSchema }) body: RegisterDto) {
    return this.commands.execute(new RegisterCommand(body));
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email', example: 'ana@example.com' },
        password: {
          type: 'string',
          format: 'password',
          example: 'clave-segura-123',
        },
      },
    },
  })
  @ApiOkResponse({ description: 'Devuelve el token de acceso y el usuario.' })
  @ApiUnauthorizedResponse({ description: 'Correo o contraseña incorrectos.' })
  login(@Body({ schema: loginSchema }) body: LoginDto) {
    return this.commands.execute(new LoginCommand(body));
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Consultar el usuario autenticado' })
  @ApiOkResponse({ description: 'Datos públicos del usuario.' })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido.' })
  me() {
    return PublicUser.toDto(this.context.requireUser());
  }
}
