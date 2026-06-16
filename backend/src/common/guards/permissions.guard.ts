import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import {
  PERMISSION_METADATA_KEY,
  PermissionRequirement,
} from '../decorators/permissions.decorator';
import { AuthUser } from '../interfaces/auth-user.interface';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const requirement = this.reflector.getAllAndOverride<
      PermissionRequirement | string[]
    >(PERMISSION_METADATA_KEY, [context.getHandler(), context.getClass()]);

    if (!requirement) {
      return true;
    }

    const { permissions, mode } = Array.isArray(requirement)
      ? { permissions: requirement, mode: 'all' as const }
      : requirement;

    if (permissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as AuthUser | undefined;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const allowed =
      mode === 'any'
        ? permissions.some((permission) => user.permissions.includes(permission))
        : permissions.every((permission) =>
            user.permissions.includes(permission),
          );

    if (!allowed) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
