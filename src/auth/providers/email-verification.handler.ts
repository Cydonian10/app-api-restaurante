import {
  AuthenticationRegistry,
  EmailVerificationHandler,
  type EmailVerificationLink,
} from '@nestjs/authentication';
import { Injectable } from '@nestjs/common';
import { Mailer } from '@nestjs/mail';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity.js';

@Injectable()
export class RestaurantEmailVerificationHandler extends EmailVerificationHandler {
  constructor(
    registry: AuthenticationRegistry,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly mailer: Mailer,
  ) {
    super();
    registry.registerHandler('emailVerification', this);
  }

  async send(link: EmailVerificationLink): Promise<void> {
    await this.mailer.send({
      to: link.email,
      subject: 'Verifica tu correo electrónico',
      text: `Confirma tu correo abriendo este enlace:\n\n${link.url}\n\nEl enlace vence en 24 horas. Si no creaste una cuenta, ignora este mensaje.`,
    });
  }

  async markVerified(userId: string, email: string): Promise<boolean> {
    const result = await this.users.update(
      { id: userId, email },
      { emailVerified: true },
    );
    return (result.affected ?? 0) > 0;
  }
}
