import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { UserRole } from '../../users/enums/user-role.enum.js';

@Injectable()
export class DiningReadGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: { role: UserRole } }>();
    return (
      request.user !== undefined &&
      [UserRole.ADMIN, UserRole.MOZO, UserRole.COCINA].includes(
        request.user.role,
      )
    );
  }
}
