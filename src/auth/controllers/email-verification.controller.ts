import {
  AuthenticationContext,
  EmailVerificationService,
  Public,
} from '@nestjs/authentication';
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  HttpCode,
  Post,
} from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { z } from 'zod';
import type { User } from '../entities/user.entity.js';

const verifySchema = z.object({ token: z.string().min(1).max(256) });
type VerifyDto = z.infer<typeof verifySchema>;

@ApiTags('Autenticación y usuarios')
@Controller('auth/email')
export class EmailVerificationController {
  constructor(
    private readonly verification: EmailVerificationService,
    private readonly context: AuthenticationContext<User>,
  ) {}

  @Public()
  @Post('verify')
  @HttpCode(200)
  @ApiOperation({ summary: 'Verificar correo con el token recibido' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['token'],
      properties: { token: { type: 'string' } },
    },
  })
  async verify(@Body({ schema: verifySchema }) body: VerifyDto) {
    const verified = await this.verification.verify(body.token);
    if (!verified)
      throw new BadRequestException(
        'El enlace es inválido, ya fue usado o ha caducado',
      );
    return { email: verified.email, emailVerified: true };
  }

  @Post('verification')
  @HttpCode(202)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reenviar enlace de verificación al usuario autenticado',
  })
  @ApiAcceptedResponse({ description: 'Enlace de verificación enviado.' })
  async resend() {
    const user = this.context.requireUser();
    if (user.emailVerified)
      throw new ConflictException('El correo ya está verificado');
    await this.verification.send(user);
    return { message: 'Se ha enviado un enlace de verificación' };
  }
}
