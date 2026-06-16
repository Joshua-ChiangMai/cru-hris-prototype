import { Injectable } from '@nestjs/common';
import { RoleCode } from '@prisma/client';
import { PermissionKey } from '../../common/constants/permissions';
import { permissionsForRoles } from '../../common/rbac/role-permissions';
import { resolveScopeLevelFromRoles } from '../../common/rbac/scope-level.util';
import { ScopeLevel } from '../../common/interfaces/auth-user.interface';

@Injectable()
export class PermissionsService {
  resolveForRoles(roles: RoleCode[]): PermissionKey[] {
    return permissionsForRoles(roles);
  }

  resolveScopeLevel(roles: RoleCode[]): ScopeLevel {
    return resolveScopeLevelFromRoles(roles);
  }
}
