import { Module } from '@nestjs/common';
import { GoogleAuthController } from './controllers/google-auth.controller.js';
import { GoogleLoginService } from './services/google-login.service.js';
import { GoogleOidcClient } from './providers/google-oidc.client.js';
import { OidcFlowStore } from './services/oidc-flow.store.js';
import { GoogleAccountResolver } from './providers/google-account.resolver.js';
import { PasswordResetController } from './controllers/password-reset.controller.js';
import { RestaurantPasswordResetHandler } from './providers/password-reset.handler.js';
import { EmailVerificationController } from './controllers/email-verification.controller.js';
import { RestaurantEmailVerificationHandler } from './providers/email-verification.handler.js';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './controllers/auth.controller.js';
import { JwtAuthProvider } from './providers/jwt-auth.provider.js';
import { RegisterHandler } from './commands/register/register.handler.js';
import { LoginHandler } from './commands/login/login.handler.js';
import { User } from './entities/user.entity.js';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [UsersModule, TypeOrmModule.forFeature([User])],
  controllers: [
    AuthController,
    EmailVerificationController,
    PasswordResetController,
    GoogleAuthController,
  ],
  providers: [
    LoginHandler,
    RegisterHandler,
    JwtAuthProvider,
    RestaurantEmailVerificationHandler,
    RestaurantPasswordResetHandler,
    GoogleAccountResolver,
    GoogleLoginService,
    GoogleOidcClient,
    OidcFlowStore,
  ],
})
export class AuthModule {}
