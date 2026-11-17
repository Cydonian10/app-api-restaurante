import {
  AuthenticationRegistry,
  PasswordResetHandler,
  type PasswordResetLink,
} from '@nestjs/authentication';
import { Injectable } from '@nestjs/common';
import { Mailer } from '@nestjs/mail';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity.js';
import { Repository } from 'typeorm';

@Injectable()
export class RestaurantPasswordResetHandler extends PasswordResetHandler {
  constructor(
    registry: AuthenticationRegistry,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly mailer: Mailer,
  ) {
    super();
    registry.registerHandler('passwordReset', this);
  }

  async findUser(email: string) {
    const matches = await this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('LOWER(user.email) = :email', { email })
      .take(2)
      .getMany();
    return matches.length === 1 ? matches[0] : null;
  }
  async updatePassword(id: string, hash: string) {
    await this.users.update({ id }, { passwordHash: hash });
  }
  async send(link: PasswordResetLink) {
    await this.mailer.send({
      to: link.email,
      subject: 'Recupera tu contraseña',
      text: `Para cambiar tu contraseña, abre este enlace:\n\n${link.url}\n\nEl enlace vence en una hora. Si no lo solicitaste, ignora este mensaje.`,
    });
  }
}
