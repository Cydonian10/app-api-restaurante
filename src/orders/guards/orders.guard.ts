import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { UserRole } from '../../users/enums/user-role.enum.js';

@Injectable()
export class OrdersGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: { role: UserRole } }>();
    return (
      request.user !== undefined &&
      [UserRole.ADMIN, UserRole.ATENCION, UserRole.MOZO].includes(
        request.user.role,
      )
    );
  }
}
