import { BadRequestException, Injectable } from '@nestjs/common';
import {
  EmploymentStatus,
  FamilyRelationship,
  Gender,
  MaritalStatus,
  Prisma,
  TrainingStatus,
} from '@prisma/client';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { RbacService } from '../../common/services/rbac.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportFilterDto } from './dto/report-filter.dto';
import {
  BOOLEAN_FILTER_FIELDS,
  DEFAULT_REPORT_FILTER_OPERATOR,
  NUMERIC_FILTER_FIELDS,
  ReportFilterField,
  ReportFilterOperator,
} from './report-filter.constants';

@Injectable()
export class ReportFilterEngine {
  constructor(
    private readonly rbac: RbacService,
    private readonly prisma: PrismaService,
  ) {}

  async buildEmployeeWhere(
    filters: ReportFilterDto[],
    authUser: AuthUser,
  ): Promise<Prisma.EmployeeWhereInput> {
    const clauses: Prisma.EmployeeWhereInput[] = [
      await this.rbac.buildEmployeeWhere(authUser),
    ];

    for (const filter of filters) {
      if (filter.field === 'familySize') {
        clauses.push(
          await this.buildFamilySizeClause(filter, authUser),
        );
        continue;
      }

      if (filter.field === 'childrenCount') {
        clauses.push(
          await this.buildChildrenCountClause(filter, authUser),
        );
        continue;
      }

      clauses.push(await this.buildClause(filter, authUser));
    }

    return { AND: clauses };
  }

  private async buildClause(
    filter: ReportFilterDto,
    authUser: AuthUser,
  ): Promise<Prisma.EmployeeWhereInput> {
    const operator = this.resolveOperator(filter);

    switch (filter.field) {
      case 'gender':
        return { gender: this.parseEnum(Gender, filter.value, 'gender') };
      case 'city':
        return this.buildCityClause(filter.value, authUser);
      case 'maritalStatus':
        return {
          maritalStatus: this.parseEnum(
            MaritalStatus,
            filter.value,
            'maritalStatus',
          ),
        };
      case 'department':
        return {
          department: {
            equals: this.parseString(filter.value, 'department'),
            mode: 'insensitive',
          },
        };
      case 'employmentStatus':
        return {
          employmentStatus: this.parseEnum(
            EmploymentStatus,
            filter.value,
            'employmentStatus',
          ),
        };
      case 'trainingCompleted':
        return this.buildTrainingCompletedClause(
          this.parseBoolean(filter.value),
        );
      case 'spouseExists':
        return this.buildSpouseExistsClause(this.parseBoolean(filter.value));
      case 'spouseIsEmployee':
        return this.buildSpouseIsEmployeeClause(this.parseBoolean(filter.value));
      case 'hasTraining':
        return this.buildHasTrainingClause(this.parseBoolean(filter.value));
      case 'trainingName':
        return this.buildTrainingNameClause(operator, filter.value);
      case 'trainingStatus':
        return {
          trainingAssignments: {
            some: {
              status: this.parseEnum(
                TrainingStatus,
                filter.value,
                'trainingStatus',
              ),
            },
          },
        };
      default:
        throw new BadRequestException(`Unsupported filter field: ${filter.field}`);
    }
  }

  private resolveOperator(filter: ReportFilterDto): ReportFilterOperator {
    const operator = filter.operator ?? DEFAULT_REPORT_FILTER_OPERATOR;

    if (NUMERIC_FILTER_FIELDS.includes(filter.field)) {
      if (!['eq', 'gte', 'lte', 'gt', 'lt'].includes(operator)) {
        throw new BadRequestException(
          `Filter "${filter.field}" requires a numeric operator (eq, gte, lte, gt, lt)`,
        );
      }
      return operator;
    }

    if (BOOLEAN_FILTER_FIELDS.includes(filter.field)) {
      if (operator !== 'eq') {
        throw new BadRequestException(
          `Filter "${filter.field}" only supports operator "eq"`,
        );
      }
      return operator;
    }

    if (filter.field === 'trainingName') {
      if (!['eq', 'contains'].includes(operator)) {
        throw new BadRequestException(
          'Filter "trainingName" supports operators "eq" or "contains"',
        );
      }
      return operator;
    }

    if (operator !== 'eq') {
      throw new BadRequestException(
        `Filter "${filter.field}" only supports operator "eq"`,
      );
    }

    return operator;
  }

  private async buildCityClause(
    value: string | number | boolean,
    authUser: AuthUser,
  ): Promise<Prisma.EmployeeWhereInput> {
    const cityId = this.parseString(value, 'city');
    const cityIds = await this.rbac.resolveCityIds(authUser);
    this.rbac.assertCityInScope(authUser, cityId, cityIds);
    return { cityId };
  }

  private async buildFamilySizeClause(
    filter: ReportFilterDto,
    authUser: AuthUser,
  ): Promise<Prisma.EmployeeWhereInput> {
    const operator = this.resolveOperator(filter);
    const count = this.parseNumber(filter.value, 'familySize');
    const employeeIds = await this.resolveFamilyMetricEmployeeIds(
      authUser,
      (members) => {
        const activeCount = members.filter(
          (member) => member.deletedAt === null,
        ).length;
        return this.compareNumeric(operator, activeCount, count);
      },
    );

    return { id: { in: employeeIds } };
  }

  private buildSpouseExistsClause(exists: boolean): Prisma.EmployeeWhereInput {
    const spouseMember: Prisma.FamilyMemberWhereInput = {
      relationshipType: FamilyRelationship.SPOUSE,
      deletedAt: null,
    };

    return {
      familyMembers: {
        some: {
          relationshipType: FamilyRelationship.WORKER,
          deletedAt: null,
          family: {
            deletedAt: null,
            members: exists
              ? { some: spouseMember }
              : { none: spouseMember },
          },
        },
      },
    };
  }

  private buildSpouseIsEmployeeClause(
    isEmployee: boolean,
  ): Prisma.EmployeeWhereInput {
    const employeeSpouse: Prisma.FamilyMemberWhereInput = {
      relationshipType: FamilyRelationship.SPOUSE,
      deletedAt: null,
      employeeId: { not: null },
    };

    return {
      familyMembers: {
        some: {
          relationshipType: FamilyRelationship.WORKER,
          deletedAt: null,
          family: {
            deletedAt: null,
            members: isEmployee
              ? { some: employeeSpouse }
              : { none: employeeSpouse },
          },
        },
      },
    };
  }

  private async buildChildrenCountClause(
    filter: ReportFilterDto,
    authUser: AuthUser,
  ): Promise<Prisma.EmployeeWhereInput> {
    const operator = this.resolveOperator(filter);
    const count = this.parseNumber(filter.value, 'childrenCount');
    const childTypes = new Set<FamilyRelationship>([
      FamilyRelationship.SON,
      FamilyRelationship.DAUGHTER,
    ]);
    const employeeIds = await this.resolveFamilyMetricEmployeeIds(
      authUser,
      (members) => {
        const children = members.filter(
          (member) =>
            member.deletedAt === null && childTypes.has(member.relationshipType),
        ).length;
        return this.compareNumeric(operator, children, count);
      },
    );

    return { id: { in: employeeIds } };
  }

  private async resolveFamilyMetricEmployeeIds(
    authUser: AuthUser,
    predicate: (
      members: Array<{
        deletedAt: Date | null;
        relationshipType: FamilyRelationship;
      }>,
    ) => boolean,
  ): Promise<string[]> {
    const scopeWhere = await this.rbac.buildEmployeeWhere(authUser);
    const workers = await this.prisma.familyMember.findMany({
      where: {
        relationshipType: FamilyRelationship.WORKER,
        deletedAt: null,
        employeeId: { not: null },
        employee: scopeWhere,
        family: { deletedAt: null },
      },
      select: {
        employeeId: true,
        family: {
          select: {
            members: {
              select: { deletedAt: true, relationshipType: true },
            },
          },
        },
      },
    });

    const employeeIds = new Set<string>();

    for (const worker of workers) {
      if (!worker.employeeId) {
        continue;
      }

      if (predicate(worker.family.members)) {
        employeeIds.add(worker.employeeId);
      }
    }

    return [...employeeIds];
  }

  private compareNumeric(
    operator: ReportFilterOperator,
    actual: number,
    expected: number,
  ): boolean {
    switch (operator) {
      case 'eq':
        return actual === expected;
      case 'gte':
        return actual >= expected;
      case 'lte':
        return actual <= expected;
      case 'gt':
        return actual > expected;
      case 'lt':
        return actual < expected;
      default:
        return false;
    }
  }

  private buildHasTrainingClause(hasTraining: boolean): Prisma.EmployeeWhereInput {
    return hasTraining
      ? { trainingAssignments: { some: {} } }
      : { trainingAssignments: { none: {} } };
  }

  private buildTrainingCompletedClause(
    completed: boolean,
  ): Prisma.EmployeeWhereInput {
    const completedAssignment = { status: TrainingStatus.COMPLETED };

    return completed
      ? { trainingAssignments: { some: completedAssignment } }
      : { trainingAssignments: { none: completedAssignment } };
  }

  private buildTrainingNameClause(
    operator: ReportFilterOperator,
    value: string | number | boolean,
  ): Prisma.EmployeeWhereInput {
    const title = this.parseString(value, 'trainingName');

    if (operator === 'contains') {
      return {
        trainingAssignments: {
          some: {
            training: {
              title: { contains: title, mode: 'insensitive' },
            },
          },
        },
      };
    }

    return {
      trainingAssignments: {
        some: {
          training: {
            title: { equals: title, mode: 'insensitive' },
          },
        },
      },
    };
  }

  private parseEnum<T extends string>(
    enumObj: Record<string, T>,
    value: string | number | boolean,
    field: string,
  ): T {
    const raw = this.parseString(value, field).toUpperCase();
    const allowed = Object.values(enumObj);

    if (!allowed.includes(raw as T)) {
      throw new BadRequestException(
        `Invalid value for filter "${field}". Allowed: ${allowed.join(', ')}`,
      );
    }

    return raw as T;
  }

  private parseString(
    value: string | number | boolean,
    field: string,
  ): string {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }

    throw new BadRequestException(
      `Filter "${field}" requires a non-empty string value`,
    );
  }

  private parseNumber(
    value: string | number | boolean,
    field: string,
  ): number {
    const numeric =
      typeof value === 'number'
        ? value
        : typeof value === 'string'
          ? Number(value)
          : NaN;

    if (!Number.isFinite(numeric)) {
      throw new BadRequestException(
        `Filter "${field}" requires a numeric value`,
      );
    }

    return numeric;
  }

  private parseBoolean(value: string | number | boolean): boolean {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true') return true;
      if (normalized === 'false') return false;
    }

    throw new BadRequestException(
      'Boolean filters require value true or false',
    );
  }
}
