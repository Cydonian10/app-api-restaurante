import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LogMailTransport, MailModule, ResendTransport } from '@nestjs/mail';

@Module({
  imports: [
    MailModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const apiKey = config.get<string>('RESEND_API_KEY')?.trim();
        const from = config.get<string>('MAIL_FROM')?.trim();
        if ((apiKey && !from) || (!apiKey && from)) {
          throw new Error('Configura RESEND_API_KEY y MAIL_FROM juntos');
        }
        if (!apiKey || !from) {
          if (config.get<string>('NODE_ENV') === 'production') {
            throw new Error(
              'RESEND_API_KEY y MAIL_FROM son obligatorios en producción',
            );
          }
          return {
            transport: new LogMailTransport({ body: true }),
            from: 'Restaurante <onboarding@resend.dev>',
          };
        }
        return { transport: new ResendTransport({ apiKey }), from };
      },
    }),
  ],
})
export class MailConfigModule {}
