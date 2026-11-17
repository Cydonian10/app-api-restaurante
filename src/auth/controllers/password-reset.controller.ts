import { PasswordResetService, Public } from '@nestjs/authentication';
import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';

const requestSchema = z.object({ email: z.email().max(254) });
const resetSchema = z.object({
  token: z.string().min(1).max(256),
  password: z.string().min(8).max(128),
});

@ApiTags('Autenticación y usuarios')
@Controller('auth/password')
export class PasswordResetController {
  constructor(private readonly resetService: PasswordResetService) {}

  @Public()
  @Post('forgot')
  @HttpCode(202)
  @ApiOperation({ summary: 'Solicitar recuperación de contraseña' })
  request(
    @Body({ schema: requestSchema }) body: z.infer<typeof requestSchema>,
  ) {
    this.resetService.request(body.email);
    return {
      message:
        'Si el correo está registrado, recibirás un enlace de recuperación.',
    };
  }

  @Public()
  @Post('reset')
  @HttpCode(200)
  @ApiOperation({ summary: 'Cambiar contraseña con un enlace de recuperación' })
  async reset(
    @Body({ schema: resetSchema }) body: z.infer<typeof resetSchema>,
  ) {
    const result = await this.resetService.reset(body.token, body.password);
    if (!result)
      throw new BadRequestException(
        'El enlace es inválido, ya fue usado o ha caducado',
      );
    return { message: 'Contraseña actualizada. Ya puedes iniciar sesión.' };
  }
}
