import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser, ScopeLevel } from '../interfaces/auth-user.interface';
import { resolveScopeLevelFromRoles } from '../rbac/scope-level.util';

@Injectable()
export class RbacService {
  constructor(private readonly prisma: PrismaService) {}

  resolveScopeLevel(roleCodes: string[]): ScopeLevel {
    return resolveScopeLevelFromRoles(roleCodes);
  }

  /** Normalize scope and city assignments after JWT validation. */
  async enrichAuthUser(user: AuthUser): Promise<AuthUser> {
    const scopeLevel = this.resolveScopeLevel(user.roleCodes);
    const cityIds =
      scopeLevel === 'CITY'
        ? await this.resolveCityIds({ ...user, scopeLevel })
        : user.cityIds;

    return { ...user, scopeLevel, cityIds };
  }

  async resolveCityIds(authUser: AuthUser): Promise<string[]> {
    if (authUser.scopeLevel === 'ALL') {
      return authUser.cityIds;
    }

    if (authUser.scopeLevel !== 'CITY') {
      return authUser.cityIds;
    }

    if (authUser.cityIds.length > 0) {
      return authUser.cityIds;
    }

    const employee = await this.prisma.employee.findFirst({
      where: { userId: authUser.userId, deletedAt: null },
      select: { cityId: true },
    });

    return employee ? [employee.cityId] : [];
  }

  async buildEmployeeWhere(
    authUser: AuthUser,
  ): Promise<Prisma.EmployeeWhereInput> {
    const base: Prisma.EmployeeWhereInput = { deletedAt: null };

    if (authUser.scopeLevel === 'ALL') {
      return base;
    }

    if (authUser.scopeLevel === 'CITY') {
      const cityIds = await this.resolveCityIds(authUser);
      if (cityIds.length === 0) {
        return { ...base, id: { in: [] } };
      }
      return { ...base, cityId: { in: cityIds } };
    }

    return { ...base, userId: authUser.userId };
  }

  async buildUpdateRequestWhere(
    authUser: AuthUser,
  ): Promise<Prisma.UpdateRequestWhereInput> {
    const base: Prisma.UpdateRequestWhereInput = { deletedAt: null };

    if (authUser.scopeLevel === 'ALL') {
      return base;
    }

    if (authUser.scopeLevel === 'CITY') {
      const cityIds = await this.resolveCityIds(authUser);
      if (cityIds.length === 0) {
        return { ...base, id: { in: [] } };
      }
      return { ...base, cityId: { in: cityIds } };
    }

    const requesterEmployee = await this.prisma.employee.findFirst({
      where: { userId: authUser.userId, deletedAt: null },
      select: { id: true },
    });

    if (!requesterEmployee) {
      return { ...base, id: { in: [] } };
    }

    return { ...base, requesterEmployeeId: requesterEmployee.id };
  }

  /**
   * Families are scoped via the WORKER member's employee record (city / own user).
   */
  async buildFamilyWhere(
    authUser: AuthUser,
  ): Promise<Prisma.FamilyWhereInput> {
    const base: Prisma.FamilyWhereInput = { deletedAt: null };

    if (authUser.scopeLevel === 'ALL') {
      return base;
    }

    const workerMemberFilter: Prisma.FamilyMemberWhereInput = {
      relationshipType: 'WORKER',
      deletedAt: null,
      employee: { deletedAt: null },
    };

    if (authUser.scopeLevel === 'CITY') {
      const cityIds = await this.resolveCityIds(authUser);
      if (cityIds.length === 0) {
        return { ...base, id: { in: [] } };
      }
      return {
        ...base,
        members: {
          some: {
            ...workerMemberFilter,
            employee: { cityId: { in: cityIds }, deletedAt: null },
          },
        },
      };
    }

    const employee = await this.prisma.employee.findFirst({
      where: { userId: authUser.userId, deletedAt: null },
      select: { id: true },
    });

    if (!employee) {
      return { ...base, id: { in: [] } };
    }

    return {
      ...base,
      members: {
        some: {
          ...workerMemberFilter,
          employeeId: employee.id,
        },
      },
    };
  }

  async assertCanAccessFamily(
    authUser: AuthUser,
    familyId: string,
  ): Promise<void> {
    const where = await this.buildFamilyWhere(authUser);
    const family = await this.prisma.family.findFirst({
      where: { ...where, id: familyId },
      select: { id: true },
    });

    if (!family) {
      throw new ForbiddenException('Access denied to this family record');
    }
  }

  async buildUserWhere(authUser: AuthUser): Promise<Prisma.UserWhereInput> {
    if (authUser.scopeLevel === 'ALL') {
      return {};
    }

    if (authUser.scopeLevel === 'CITY') {
      const cityIds = await this.resolveCityIds(authUser);
      if (cityIds.length === 0) {
        return { id: { in: [] } };
      }
      return {
        userRoles: {
          some: {
            cityId: { in: cityIds },
          },
        },
      };
    }

    return { id: authUser.userId };
  }

  assertCityInScope(authUser: AuthUser, cityId: string, cityIds?: string[]): void {
    if (authUser.scopeLevel === 'ALL') {
      return;
    }

    if (authUser.scopeLevel === 'OWN') {
      throw new ForbiddenException('City-scoped access is not allowed for this role');
    }

    const allowed = cityIds ?? authUser.cityIds;
    if (!allowed.includes(cityId)) {
      throw new ForbiddenException('Access denied for this city');
    }
  }

  async assertCanAccessEmployee(
    authUser: AuthUser,
    employee: { id: string; userId: string | null; cityId: string },
  ): Promise<void> {
    if (authUser.scopeLevel === 'ALL') {
      return;
    }

    if (authUser.scopeLevel === 'OWN') {
      if (employee.userId !== authUser.userId) {
        throw new ForbiddenException('Access denied to this employee record');
      }
      return;
    }

    const cityIds = await this.resolveCityIds(authUser);
    if (!cityIds.includes(employee.cityId)) {
      throw new ForbiddenException('Access denied to this employee record');
    }
  }

  async assertCanAccessUpdateRequest(
    authUser: AuthUser,
    request: {
      cityId: string;
      requesterEmployeeId: string;
      requester?: { userId: string | null };
    },
  ): Promise<void> {
    if (authUser.scopeLevel === 'ALL') {
      return;
    }

    if (authUser.scopeLevel === 'OWN') {
      const requesterUserId = request.requester?.userId;
      if (requesterUserId !== authUser.userId) {
        throw new ForbiddenException('Access denied to this request');
      }
      return;
    }

    const cityIds = await this.resolveCityIds(authUser);
    if (!cityIds.includes(request.cityId)) {
      throw new ForbiddenException('Access denied to this request');
    }
  }

  canEditEmployee(
    authUser: AuthUser,
    employee: { userId: string | null },
  ): boolean {
    if (
      authUser.permissions.includes('employee_profile:edit') &&
      (authUser.scopeLevel === 'ALL' || authUser.scopeLevel === 'CITY')
    ) {
      return true;
    }

    if (authUser.scopeLevel === 'OWN' && employee.userId === authUser.userId) {
      return authUser.permissions.includes('employee_profile:edit');
    }

    return false;
  }

  canReviewApprovals(authUser: AuthUser): boolean {
    return (
      authUser.permissions.includes('approval_center:approve') &&
      (authUser.scopeLevel === 'ALL' || authUser.scopeLevel === 'CITY')
    );
  }

  canEditAllEmployeeFields(authUser: AuthUser): boolean {
    return authUser.scopeLevel === 'ALL' || authUser.scopeLevel === 'CITY';
  }
}
