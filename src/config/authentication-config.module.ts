import { Module } from '@nestjs/common';
import { AuthenticationModule } from '@nestjs/authentication';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    AuthenticationModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const clientId = config.get<string>('GOOGLE_CLIENT_ID')?.trim();
        const clientSecret = config.get<string>('GOOGLE_CLIENT_SECRET')?.trim();
        if (!!clientId !== !!clientSecret)
          throw new Error(
            'Configura GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET juntos',
          );
        return {
          accessToken: {
            key: config.getOrThrow<string>('JWT_SECRET'),
            ttl: '1h',
          },
          refreshToken: false,
          passwordReset: {
            url: `${config.get<string>('APP_URL') ?? 'http://localhost:4200'}/reset-password`,
          },
          emailVerification: {
            url: `${config.get<string>('APP_URL') ?? 'http://localhost:4200'}/verify-email`,
          },
        };
      },
    }),
  ],
})
export class AuthenticationConfigModule {}
