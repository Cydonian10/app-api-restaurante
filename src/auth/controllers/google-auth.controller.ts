import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Header,
  HttpCode,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { CurrentUser, Public } from '@nestjs/authentication';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response, CookieOptions } from 'express';
import { GoogleLoginService } from '../services/google-login.service.js';
import {
  googleCallbackSchema,
  exchangeGoogleCodeSchema,
  type GoogleCallbackDto,
  type ExchangeGoogleCodeDto,
} from '../dtos/google-auth.dto.js';

@ApiTags('auth/google')
@Controller('auth/oidc/google')
export class GoogleAuthController {
  constructor(private readonly google: GoogleLoginService) {}

  private get cookieName() {
    return this.google.secureCookie ? '__Host-google_login' : 'google_login';
  }
  private get cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.google.secureCookie,
      path: '/',
    };
  }
  private binding(request: Request) {
    return request.headers.cookie
      ?.split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${this.cookieName}=`))
      ?.slice(this.cookieName.length + 1);
  }

  @Public()
  @Get('config')
  config() {
    return { enabled: this.google.enabled };
  }

  @Public()
  @Get('login')
  @ApiOperation({
    summary:
      'Abrir en el navegador para iniciar sesión o registrarse con Google',
  })
  async login(@Res() response: Response) {
    const started = await this.google.start();
    response.cookie(this.cookieName, started.binding, {
      ...this.cookieOptions,
      maxAge: 11 * 60_000,
    });
    response.setHeader('Cache-Control', 'no-store');
    response.redirect(started.url);
  }

  @Post('link')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Vincular Google al usuario autenticado; navegar a la URL devuelta',
  })
  @Header('Cache-Control', 'no-store')
  async link(
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const started = await this.google.start(userId);
    response.cookie(this.cookieName, started.binding, {
      ...this.cookieOptions,
      maxAge: 11 * 60_000,
    });
    return { url: started.url };
  }

  @Public()
  @Get('callback')
  async callback(
    @Query({ schema: googleCallbackSchema }) query: GoogleCallbackDto,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const url = await this.google.finish(query, this.binding(request));
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.redirect(url);
  }

  @Public()
  @Post('exchange')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary:
      'Canjear el código de un solo uso por JWT (requiere cookie del mismo navegador)',
  })
  async exchange(
    @Body({ schema: exchangeGoogleCodeSchema }) body: ExchangeGoogleCodeDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (request.headers.origin !== new URL(this.google.frontendCallback).origin)
      throw new ForbiddenException('Frontend origin required');
    const tokens = await this.google.exchange(body.code, this.binding(request));
    response.clearCookie(this.cookieName, this.cookieOptions);
    return tokens;
  }
}
