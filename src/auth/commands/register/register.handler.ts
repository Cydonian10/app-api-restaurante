import { EmailVerificationService } from '@nestjs/authentication';
import { Logger } from '@nestjs/common';
import { CommandBus, CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { CreateUserCommand } from '../../../users/commands/create-user/create-user.command.js';
import { PublicUser } from '../../dtos/public-user.dto.js';
import { RegisterCommand } from './register.command.js';

@CommandHandler(RegisterCommand)
export class RegisterHandler implements ICommandHandler<RegisterCommand> {
  constructor(
    private readonly commands: CommandBus,
    private readonly verification: EmailVerificationService,
  ) {}

  async execute({ data }: RegisterCommand) {
    const user = await this.commands.execute(new CreateUserCommand(data));
    try {
      await this.verification.send(user);
    } catch (error) {
      new Logger(RegisterHandler.name).error(
        'No se pudo enviar el enlace de verificación',
        error instanceof Error ? error.message : undefined,
      );
    }
    return PublicUser.toDto(user);
  }
}
