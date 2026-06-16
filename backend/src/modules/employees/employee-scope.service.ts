import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { RbacService } from '../../common/services/rbac.service';

/** Employee list/detail scope filters — delegates to {@link RbacService}. */
@Injectable()
export class EmployeeScopeService {
  constructor(private readonly rbac: RbacService) {}

  resolveCityIds(authUser: AuthUser) {
    return this.rbac.resolveCityIds(authUser);
  }

  buildListWhere(authUser: AuthUser): Promise<Prisma.EmployeeWhereInput> {
    return this.rbac.buildEmployeeWhere(authUser);
  }

  assertCanAccessEmployee(
    authUser: AuthUser,
    employee: { id: string; userId: string | null; cityId: string },
  ) {
    return this.rbac.assertCanAccessEmployee(authUser, employee);
  }

  canEditEmployee(
    authUser: AuthUser,
    employee: { userId: string | null },
  ): boolean {
    return this.rbac.canEditEmployee(authUser, employee);
  }

  canEditAllFields(authUser: AuthUser): boolean {
    return this.rbac.canEditAllEmployeeFields(authUser);
  }
}
