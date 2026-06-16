import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { ListEmployeesQueryDto } from './dto/list-employees-query.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { SensitiveFieldsService } from '../../common/services/sensitive-fields.service';
import { EmployeeScopeService } from './employee-scope.service';

const employeeInclude = {
  city: true,
  manager: {
    select: {
      id: true,
      employeeNo: true,
      firstName: true,
      lastName: true,
    },
  },
} satisfies Prisma.EmployeeInclude;

@Injectable()
export class EmployeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scopeService: EmployeeScopeService,
    private readonly sensitiveFields: SensitiveFieldsService,
  ) {}

  async listEmployees(query: ListEmployeesQueryDto, authUser: AuthUser) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const scopeWhere = await this.scopeService.buildListWhere(authUser);
    const filters: Prisma.EmployeeWhereInput[] = [scopeWhere];

    if (query.cityId) {
      if (authUser.scopeLevel === 'CITY') {
        const cityIds = await this.scopeService.resolveCityIds(authUser);
        if (!cityIds.includes(query.cityId)) {
          throw new ForbiddenException('City filter outside your scope');
        }
      }
      filters.push({ cityId: query.cityId });
    }

    if (query.employmentStatus) {
      filters.push({ employmentStatus: query.employmentStatus });
    }

    if (query.search?.trim()) {
      const term = query.search.trim();
      filters.push({
        OR: [
          { firstName: { contains: term, mode: 'insensitive' } },
          { lastName: { contains: term, mode: 'insensitive' } },
          { employeeNo: { contains: term, mode: 'insensitive' } },
          { workEmail: { contains: term, mode: 'insensitive' } },
        ],
      });
    }

    const where: Prisma.EmployeeWhereInput = { AND: filters };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.employee.count({ where }),
      this.prisma.employee.findMany({
        where,
        include: employeeInclude,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        skip,
        take: limit,
      }),
    ]);

    return {
      data: data.map((employee) => this.toEmployeeResponse(employee, authUser)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async listCitiesForFilter(authUser: AuthUser) {
    if (authUser.scopeLevel === 'ALL') {
      return this.prisma.city.findMany({
        where: { deletedAt: null, isActive: true },
        orderBy: { name: 'asc' },
        select: { id: true, code: true, name: true },
      });
    }

    if (authUser.scopeLevel === 'CITY') {
      const cityIds = await this.scopeService.resolveCityIds(authUser);
      return this.prisma.city.findMany({
        where: { id: { in: cityIds }, deletedAt: null, isActive: true },
        orderBy: { name: 'asc' },
        select: { id: true, code: true, name: true },
      });
    }

    const employee = await this.prisma.employee.findFirst({
      where: { userId: authUser.userId, deletedAt: null },
      include: { city: { select: { id: true, code: true, name: true } } },
    });

    return employee?.city ? [employee.city] : [];
  }

  async getMe(authUser: AuthUser) {
    const employee = await this.prisma.employee.findFirst({
      where: { userId: authUser.userId, deletedAt: null },
      include: {
        ...employeeInclude,
        directReports: {
          where: { deletedAt: null },
          select: {
            id: true,
            employeeNo: true,
            firstName: true,
            lastName: true,
            employmentStatus: true,
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee profile not linked to this user');
    }

    return this.toEmployeeDetailResponse(employee, authUser);
  }

  async getEmployeeById(id: string, authUser: AuthUser) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, deletedAt: null },
      include: {
        ...employeeInclude,
        directReports: {
          where: { deletedAt: null },
          select: {
            id: true,
            employeeNo: true,
            firstName: true,
            lastName: true,
            employmentStatus: true,
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    await this.scopeService.assertCanAccessEmployee(authUser, employee);

    return this.toEmployeeDetailResponse(employee, authUser);
  }

  async createEmployee(payload: CreateEmployeeDto, authUser: AuthUser) {
    if (authUser.scopeLevel === 'OWN') {
      throw new ForbiddenException('Staff cannot create employees');
    }

    if (authUser.scopeLevel === 'CITY') {
      const cityIds = await this.scopeService.resolveCityIds(authUser);
      if (!cityIds.includes(payload.cityId)) {
        throw new ForbiddenException('Cannot create employee outside your city');
      }
    }

    const employee = await this.prisma.employee.create({
      data: {
        employeeNo: payload.employeeNo,
        cityId: payload.cityId,
        managerEmployeeId: payload.managerEmployeeId,
        firstName: payload.firstName,
        lastName: payload.lastName,
        workEmail: payload.workEmail,
        phone: payload.phone,
        jobTitle: payload.jobTitle,
        employmentStatus: payload.employmentStatus,
        hireDate: payload.hireDate ? new Date(payload.hireDate) : undefined,
      },
      include: employeeInclude,
    });

    return this.toEmployeeDetailResponse(employee, authUser);
  }

  async updateEmployee(
    id: string,
    payload: UpdateEmployeeDto,
    authUser: AuthUser,
  ) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, deletedAt: null },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    await this.scopeService.assertCanAccessEmployee(authUser, employee);

    if (!this.scopeService.canEditEmployee(authUser, employee)) {
      throw new ForbiddenException('You cannot edit this employee');
    }

    const snapshot = this.sensitiveFields.buildEmployeeSnapshot(employee);
    const proposed = payload as Record<string, unknown>;

    if (
      this.sensitiveFields.requiresApprovalForPayload(
        this.scopeService.canEditAllFields(authUser),
        snapshot,
        proposed,
      )
    ) {
      throw new BadRequestException({
        message:
          'Sensitive field changes require approval. Submit an update request.',
        code: 'SENSITIVE_APPROVAL_REQUIRED',
      });
    }

    const updateData = this.buildUpdateData(payload, authUser);

    const updated = await this.prisma.employee.update({
      where: { id },
      data: updateData,
      include: employeeInclude,
    });

    return this.toEmployeeDetailResponse(updated, authUser);
  }

  private buildUpdateData(
    payload: UpdateEmployeeDto,
    authUser: AuthUser,
  ): Prisma.EmployeeUpdateInput {
    const payloadWithDate = payload as UpdateEmployeeDto & { hireDate?: string };

    if (this.scopeService.canEditAllFields(authUser)) {
      const data: Prisma.EmployeeUpdateInput = {
        employeeNo: payload.employeeNo,
        firstName: payload.firstName,
        lastName: payload.lastName,
        workEmail: payload.workEmail,
        phone: payload.phone,
        jobTitle: payload.jobTitle,
        employmentStatus: payload.employmentStatus,
        hireDate: payloadWithDate.hireDate
          ? new Date(payloadWithDate.hireDate)
          : undefined,
      };

      if (payload.cityId) {
        data.city = { connect: { id: payload.cityId } };
      }

      if (payload.managerEmployeeId !== undefined) {
        data.manager = payload.managerEmployeeId
          ? { connect: { id: payload.managerEmployeeId } }
          : { disconnect: true };
      }

      return data;
    }

    return {
      phone: payload.phone,
      jobTitle: payload.jobTitle,
    };
  }

  private toEmployeeResponse(
    employee: Prisma.EmployeeGetPayload<{ include: typeof employeeInclude }>,
    authUser: AuthUser,
  ) {
    return {
      id: employee.id,
      employeeNo: employee.employeeNo,
      firstName: employee.firstName,
      lastName: employee.lastName,
      fullName: `${employee.firstName} ${employee.lastName}`,
      workEmail: employee.workEmail,
      phone: employee.phone,
      jobTitle: employee.jobTitle,
      employmentStatus: employee.employmentStatus,
      hireDate: employee.hireDate,
      city: employee.city,
      manager: employee.manager,
      canEdit: this.scopeService.canEditEmployee(authUser, employee),
    };
  }

  private toEmployeeDetailResponse(
    employee: Prisma.EmployeeGetPayload<{ include: typeof employeeInclude }> & {
      directReports?: Array<{
        id: string;
        employeeNo: string;
        firstName: string;
        lastName: string;
        employmentStatus: string;
      }>;
    },
    authUser: AuthUser,
  ) {
    return {
      ...this.toEmployeeResponse(employee, authUser),
      managerEmployeeId: employee.managerEmployeeId,
      cityId: employee.cityId,
      userId: employee.userId,
      directReports: employee.directReports ?? [],
      canEditAllFields: this.scopeService.canEditAllFields(authUser),
    };
  }
}
