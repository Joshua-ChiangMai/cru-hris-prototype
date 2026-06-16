import { Injectable, NotFoundException } from '@nestjs/common';
import { FamilyRelationship, Prisma } from '@prisma/client';
import { RbacService } from '../../common/services/rbac.service';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { ListFamiliesQueryDto } from './dto/list-families-query.dto';

type FamilyWithMembers = Prisma.FamilyGetPayload<{
  include: { members: { include: { employee: { include: { city: true } } } } };
}>;

function membersInclude() {
  return {
    where: { deletedAt: null },
    orderBy: [
      { relationshipType: 'asc' as const },
      { lastName: 'asc' as const },
      { firstName: 'asc' as const },
    ],
    include: {
      employee: {
        select: {
          id: true,
          employeeNo: true,
          workEmail: true,
          jobTitle: true,
          department: true,
          city: { select: { id: true, code: true, name: true } },
        },
      },
    },
  };
}

@Injectable()
export class FamilyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rbac: RbacService,
  ) {}

  async listFamilies(query: ListFamiliesQueryDto, authUser: AuthUser) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const scopeWhere = await this.rbac.buildFamilyWhere(authUser);

    const where: Prisma.FamilyWhereInput = {
      ...scopeWhere,
    };

    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { rcNumber: { contains: term, mode: 'insensitive' } },
        { displayName: { contains: term, mode: 'insensitive' } },
        {
          members: {
            some: {
              deletedAt: null,
              OR: [
                { firstName: { contains: term, mode: 'insensitive' } },
                { lastName: { contains: term, mode: 'insensitive' } },
              ],
            },
          },
        },
      ];
    }

    const [total, families] = await Promise.all([
      this.prisma.family.count({ where }),
      this.prisma.family.findMany({
        where,
        skip,
        take: limit,
        orderBy: { displayName: 'asc' },
        include: {
          members: membersInclude(),
        },
      }),
    ]);

    return {
      data: families.map((family) => this.toFamilySummary(family)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  }

  async getMyFamily(authUser: AuthUser) {
    const scopeWhere = await this.rbac.buildFamilyWhere(authUser);
    const family = await this.prisma.family.findFirst({
      where: scopeWhere,
      include: { members: membersInclude() },
    });

    if (!family) {
      throw new NotFoundException('No family record linked to your employee profile');
    }

    return { data: this.toFamilyDetail(family) };
  }

  async getFamilyById(id: string, authUser: AuthUser) {
    await this.rbac.assertCanAccessFamily(authUser, id);

    const family = await this.prisma.family.findFirst({
      where: { id, deletedAt: null },
      include: { members: membersInclude() },
    });

    if (!family) {
      throw new NotFoundException('Family not found');
    }

    return { data: this.toFamilyDetail(family) };
  }

  private toFamilySummary(family: FamilyWithMembers) {
    const worker = family.members.find(
      (m) => m.relationshipType === FamilyRelationship.WORKER,
    );
    const employeeSpouse = family.members.find(
      (m) =>
        m.relationshipType === FamilyRelationship.SPOUSE &&
        m.employeeId !== null,
    );

    return {
      id: family.id,
      rcNumber: family.rcNumber,
      displayName: family.displayName,
      memberCount: family.members.length,
      spouseIsEmployee: Boolean(employeeSpouse),
      employeeSpouse: employeeSpouse
        ? {
            id: employeeSpouse.id,
            employeeId: employeeSpouse.employeeId,
            employeeNo: employeeSpouse.employee?.employeeNo ?? null,
            fullName: `${employeeSpouse.firstName} ${employeeSpouse.lastName}`,
          }
        : null,
      worker: worker
        ? {
            id: worker.id,
            firstName: worker.firstName,
            lastName: worker.lastName,
            employeeNo: worker.employee?.employeeNo ?? null,
            city: worker.employee?.city ?? null,
          }
        : null,
      members: family.members.map((m) => this.toMember(m)),
    };
  }

  serializeFamily(family: FamilyWithMembers) {
    return this.toFamilyDetail(family);
  }

  async getFamilyPayloadForEmployee(employeeId: string) {
    const family = await this.prisma.family.findFirst({
      where: {
        deletedAt: null,
        members: {
          some: {
            employeeId,
            relationshipType: FamilyRelationship.WORKER,
            deletedAt: null,
          },
        },
      },
      include: { members: membersInclude() },
    });

    if (!family) {
      return null;
    }

    return this.serializeFamily(family);
  }

  async applyFamily(
    family: {
      id: string;
      rcNumber: string;
      displayName: string;
      members: Array<{
        relationshipType: FamilyRelationship;
        firstName: string;
        lastName: string;
        dateOfBirth: string | null;
        employeeId?: string | null;
      }>;
    },
  ) {
    await this.prisma.$transaction(async (tx) => {
      await tx.family.update({
        where: { id: family.id },
        data: { displayName: family.displayName },
      });

      const existing = await tx.familyMember.findMany({
        where: { familyId: family.id, deletedAt: null },
        select: { id: true, employeeId: true, relationshipType: true },
      });

      const worker = existing.find(
        (m) => m.relationshipType === FamilyRelationship.WORKER,
      );

      await tx.familyMember.updateMany({
        where: { familyId: family.id, deletedAt: null },
        data: { deletedAt: new Date() },
      });

      for (const member of family.members) {
        const employeeId =
          member.relationshipType === FamilyRelationship.WORKER
            ? worker?.employeeId ?? member.employeeId ?? null
            : null;

        await tx.familyMember.create({
          data: {
            familyId: family.id,
            employeeId,
            relationshipType: member.relationshipType,
            firstName: member.firstName,
            lastName: member.lastName,
            dateOfBirth: member.dateOfBirth
              ? new Date(member.dateOfBirth)
              : null,
          },
        });
      }
    });
  }

  mergeFamilyUpdate(
    current: ReturnType<FamilyService['serializeFamily']>,
    payload: {
      displayName: string;
      members: Array<{
        relationshipType: FamilyRelationship;
        firstName: string;
        lastName: string;
        dateOfBirth?: string;
      }>;
    },
  ) {
    const workerMember = current.members.find(
      (m) => m.relationshipType === FamilyRelationship.WORKER,
    );

    return {
      ...current,
      displayName: payload.displayName,
      memberCount: payload.members.length,
      members: payload.members.map((m) => ({
        id: '',
        familyId: current.id,
        relationshipType: m.relationshipType,
        firstName: m.firstName,
        lastName: m.lastName,
        fullName: `${m.firstName} ${m.lastName}`,
        dateOfBirth: m.dateOfBirth ?? null,
        employeeId:
          m.relationshipType === FamilyRelationship.WORKER
            ? workerMember?.employeeId ?? null
            : null,
        employeeNo:
          m.relationshipType === FamilyRelationship.WORKER
            ? workerMember?.employeeNo ?? null
            : null,
        workEmail: null,
        jobTitle: null,
        department: null,
        city: workerMember?.city ?? null,
      })),
    };
  }

  private toFamilyDetail(family: FamilyWithMembers) {
    const summary = this.toFamilySummary(family);
    return {
      ...summary,
      relationships: this.summarizeRelationships(family.members),
    };
  }

  private summarizeRelationships(members: FamilyWithMembers['members']) {
    const counts: Record<FamilyRelationship, number> = {
      WORKER: 0,
      SPOUSE: 0,
      SON: 0,
      DAUGHTER: 0,
      PARENT: 0,
    };

    for (const member of members) {
      counts[member.relationshipType] += 1;
    }

    return counts;
  }

  private toMember(member: FamilyWithMembers['members'][number]) {
    return {
      id: member.id,
      familyId: member.familyId,
      relationshipType: member.relationshipType,
      firstName: member.firstName,
      lastName: member.lastName,
      fullName: `${member.firstName} ${member.lastName}`,
      dateOfBirth: member.dateOfBirth?.toISOString().slice(0, 10) ?? null,
      employeeId: member.employeeId,
      employeeNo: member.employee?.employeeNo ?? null,
      workEmail: member.employee?.workEmail ?? null,
      jobTitle: member.employee?.jobTitle ?? null,
      department: member.employee?.department ?? null,
      city: member.employee?.city ?? null,
    };
  }
}
