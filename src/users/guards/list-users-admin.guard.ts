import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import type { User } from '../../auth/entities/user.entity.js';
import { UserRole } from '../enums/user-role.enum.js';

@Injectable()
export class ListUsersAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // The global authentication guard sets request.user before route guards run.
    const { user } = context
      .switchToHttp()
      .getRequest<{ user?: User | null }>();
    return user?.role === UserRole.ADMIN;
  }
}
