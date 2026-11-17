import { LoginDto } from '../../dtos/login.dto.js';

/** Encapsula los datos necesarios para procesar una solicitud de inicio de sesión. */
export class LoginCommand {
  constructor(public readonly data: LoginDto) {}
}
