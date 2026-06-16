import { Injectable } from '@nestjs/common';
import { hash } from 'bcryptjs';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { RbacService } from '../../common/services/rbac.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rbac: RbacService,
  ) {}

  async listUsers(authUser: AuthUser) {
    const where = await this.rbac.buildUserWhere(authUser);

    return this.prisma.user.findMany({
      where,
      include: {
        userRoles: {
          include: {
            role: true,
            city: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createUser(payload: CreateUserDto) {
    return this.prisma.$transaction(async (tx) => {
      const passwordHash = await hash(payload.password, 12);
      const user = await tx.user.create({
        data: {
          email: payload.email,
          passwordHash,
        },
      });

      if (payload.roleCodes.length === 0) {
        return user;
      }

      const roles = await tx.role.findMany({
        where: { code: { in: payload.roleCodes as never[] } },
      });

      await tx.userRole.createMany({
        data: roles.map((role) => ({
          userId: user.id,
          roleId: role.id,
          cityId: payload.cityIds?.[0] ?? null,
          scopeType: payload.cityIds?.length ? 'CITY' : 'GLOBAL',
        })),
        skipDuplicates: true,
      });

      return user;
    });
  }

  async updateUserRoles(userId: string, payload: UpdateUserRolesDto) {
    return this.prisma.$transaction(async (tx) => {
      const roles = await tx.role.findMany({
        where: { code: { in: payload.roleCodes as never[] } },
      });

      await tx.userRole.deleteMany({ where: { userId } });

      if (roles.length > 0) {
        await tx.userRole.createMany({
          data: roles.map((role) => ({
            userId,
            roleId: role.id,
            cityId: payload.cityIds?.[0] ?? null,
            scopeType: payload.cityIds?.length ? 'CITY' : 'GLOBAL',
          })),
        });
      }

      return tx.user.findUnique({
        where: { id: userId },
        include: { userRoles: { include: { role: true, city: true } } },
      });
    });
  }
}
