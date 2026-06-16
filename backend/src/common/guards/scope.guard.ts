import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SCOPE_METADATA_KEY } from '../decorators/scope.decorator';
import { AuthUser, ScopeLevel } from '../interfaces/auth-user.interface';
import { hasScopeLevel } from '../rbac/scope-level.util';

@Injectable()
export class ScopeGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const requiredScopes = this.reflector.getAllAndOverride<ScopeLevel[]>(
      SCOPE_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredScopes || requiredScopes.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as AuthUser | undefined;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (!hasScopeLevel(user.scopeLevel, requiredScopes)) {
      throw new ForbiddenException('Insufficient data scope for this action');
    }

    return true;
  }
}
