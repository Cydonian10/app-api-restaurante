import { PasswordHasher, TokenService } from '@nestjs/authentication';
import { UnauthorizedException } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { LoginCommand } from './login.command.js';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import { PublicUser } from '../../dtos/public-user.dto.js';

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand> {
  constructor(
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async execute({ data }: LoginCommand) {
    const user = await this.users
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.person', 'person')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: data.email })
      .getOne();

    const valid = await this.hasher.verify(data.password, user?.passwordHash);

    if (!user || !valid)
      throw new UnauthorizedException('Correo o contraseña incorrectos');

    if (this.hasher.needsRehash(user.passwordHash)) {
      await this.users.update({ id: user.id }, { passwordHash: data.password });
    }

    const { accessToken } = await this.tokens.issue(user.id, {
      method: 'password',
    });

    return { accessToken, user: PublicUser.toDto(user) };
  }
}
