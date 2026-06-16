import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { CITY_ACCESS_PARAM_KEY } from '../decorators/city-access.decorator';
import { AuthUser } from '../interfaces/auth-user.interface';
import { RbacService } from '../services/rbac.service';

@Injectable()
export class CityAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rbac: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const paramName = this.reflector.getAllAndOverride<string>(
      CITY_ACCESS_PARAM_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!paramName) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as AuthUser | undefined;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const cityId =
      (request.params[paramName] as string | undefined) ??
      (request.query[paramName] as string | undefined) ??
      (request.body as Record<string, string> | undefined)?.[paramName];

    if (!cityId) {
      return true;
    }

    const cityIds = await this.rbac.resolveCityIds(user);
    this.rbac.assertCityInScope(user, cityId, cityIds);
    return true;
  }
}
