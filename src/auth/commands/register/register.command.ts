import type { RegisterDto } from '../../dtos/register.dto.js';

export class RegisterCommand {
  constructor(public readonly data: RegisterDto) {}
}
