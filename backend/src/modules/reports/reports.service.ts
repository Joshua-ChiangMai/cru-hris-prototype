import { ForbiddenException, Injectable } from '@nestjs/common';
import { EmploymentStatus, Prisma } from '@prisma/client';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { RbacService } from '../../common/services/rbac.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EmployeeReportQueryDto } from './dto/employee-report-query.dto';
import { HeadcountQueryDto } from './dto/headcount-query.dto';
import { ReportExportDto } from './dto/report-export.dto';
import { ReportQueryDto } from './dto/report-query.dto';
import { MAX_REPORT_QUERY_ROWS } from './report-filter.constants';
import { ReportFilterEngine } from './report-filter.engine';
import { CsvColumn, rowsToCsv } from './utils/csv-export.util';
import {
  getReportExportFilename,
  reportQueryRowsToCsv,
  reportQueryRowsToExcelBuffer,
  toReportQueryExportRows,
} from './utils/report-query-export.util';
import {
  formatReportEnumLabel,
  formatTrainingStatusLabel,
} from './utils/report-summaries.util';

const MAX_CSV_EXPORT_ROWS = 5000;

type EmployeeReportRow = {
  employeeNo: string;
  firstName: string;
  lastName: string;
  workEmail: string | null;
  phone: string | null;
  jobTitle: string | null;
  department: string | null;
  employmentStatus: EmploymentStatus;
  hireDate: Date | null;
  city: { code: string; name: string };
};

const csvColumns: CsvColumn<EmployeeReportRow>[] = [
  { header: 'Employee No', value: (r) => r.employeeNo },
  { header: 'First Name', value: (r) => r.firstName },
  { header: 'Last Name', value: (r) => r.lastName },
  { header: 'Work Email', value: (r) => r.workEmail },
  { header: 'Phone', value: (r) => r.phone },
  { header: 'Job Title', value: (r) => r.jobTitle },
  { header: 'Department', value: (r) => r.department },
  { header: 'Employment Status', value: (r) => r.employmentStatus },
  {
    header: 'Hire Date',
    value: (r) => (r.hireDate ? r.hireDate.toISOString().slice(0, 10) : ''),
  },
  { header: 'City Code', value: (r) => r.city.code },
  { header: 'City Name', value: (r) => r.city.name },
];

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rbac: RbacService,
    private readonly filterEngine: ReportFilterEngine,
  ) {}

  async getDashboard(authUser: AuthUser) {
    const employeeWhere = await this.rbac.buildEmployeeWhere(authUser);
    const requestWhere = await this.rbac.buildUpdateRequestWhere(authUser);

    const [employeeCount, pendingApprovals, cityGroups] = await Promise.all([
      this.prisma.employee.count({ where: employeeWhere }),
      this.prisma.updateRequest.count({
        where: { ...requestWhere, status: 'PENDING' },
      }),
      this.prisma.employee.groupBy({
        by: ['cityId'],
        where: employeeWhere,
        _count: { _all: true },
        orderBy: { cityId: 'asc' },
      }),
    ]);

    const cityIds = cityGroups.map((g) => g.cityId);
    const cities =
      cityIds.length > 0
        ? await this.prisma.city.findMany({
            where: { id: { in: cityIds } },
            select: { id: true, code: true, name: true },
          })
        : [];

    const cityById = new Map(cities.map((c) => [c.id, c]));

    const citySummary = cityGroups
      .map((group) => {
        const city = cityById.get(group.cityId);
        return {
          cityId: group.cityId,
          cityCode: city?.code ?? '—',
          cityName: city?.name ?? 'Unknown',
          employeeCount: group._count._all,
        };
      })
      .sort((a, b) => a.cityName.localeCompare(b.cityName));

    return {
      employeeCount,
      pendingApprovals,
      citySummary,
      scopeLevel: authUser.scopeLevel,
    };
  }

  async getHeadcount(query: HeadcountQueryDto, authUser: AuthUser) {
    const where = await this.buildScopedEmployeeWhere(query, authUser);

    const [totalEmployees, byEmploymentStatus, byCity] = await Promise.all([
      this.prisma.employee.count({ where }),
      this.prisma.employee.groupBy({
        by: ['employmentStatus'],
        where,
        _count: { _all: true },
      }),
      this.prisma.employee.groupBy({
        by: ['cityId'],
        where,
        _count: { _all: true },
      }),
    ]);

    const cityIds = byCity.map((row) => row.cityId);
    const cities =
      cityIds.length > 0
        ? await this.prisma.city.findMany({
            where: { id: { in: cityIds } },
            select: { id: true, code: true, name: true },
          })
        : [];
    const cityById = new Map(cities.map((c) => [c.id, c]));

    return {
      totalEmployees,
      byEmploymentStatus: byEmploymentStatus.map((row) => ({
        status: row.employmentStatus,
        count: row._count._all,
      })),
      byCity: byCity
        .map((row) => {
          const city = cityById.get(row.cityId);
          return {
            cityId: row.cityId,
            cityCode: city?.code ?? '—',
            cityName: city?.name ?? 'Unknown',
            count: row._count._all,
          };
        })
        .sort((a, b) => a.cityName.localeCompare(b.cityName)),
    };
  }

  async getStatistics(query: HeadcountQueryDto, authUser: AuthUser) {
    const headcount = await this.getHeadcount(query, authUser);
    const requestWhere = await this.rbac.buildUpdateRequestWhere(authUser);

    const approvalByStatus = await this.prisma.updateRequest.groupBy({
      by: ['status'],
      where: requestWhere,
      _count: { _all: true },
      orderBy: { status: 'asc' },
    });

    return {
      ...headcount,
      approvalByStatus: approvalByStatus.map((row) => ({
        status: row.status,
        count: row._count._all,
      })),
    };
  }

  async getApprovalSummary(authUser: AuthUser) {
    const where = await this.rbac.buildUpdateRequestWhere(authUser);

    const rows = await this.prisma.updateRequest.groupBy({
      by: ['status'],
      where,
      _count: { _all: true },
      orderBy: { status: 'asc' },
    });

    return rows.map((row) => ({
      status: row.status,
      count: row._count._all,
    }));
  }

  async queryReport(payload: ReportQueryDto, authUser: AuthUser) {
    const where = await this.filterEngine.buildEmployeeWhere(
      payload.filters ?? [],
      authUser,
    );

    const [total, rows, summaries] = await Promise.all([
      this.prisma.employee.count({ where }),
      this.prisma.employee.findMany({
        where,
        include: { city: { select: { id: true, code: true, name: true } } },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        take: MAX_REPORT_QUERY_ROWS + 1,
      }),
      this.buildQuerySummaries(where),
    ]);

    if (rows.length > MAX_REPORT_QUERY_ROWS) {
      throw new ForbiddenException(
        `Query exceeds maximum of ${MAX_REPORT_QUERY_ROWS} rows. Add filters to narrow results.`,
      );
    }

    return {
      total,
      employees: rows.map((employee) => this.serializeReportEmployee(employee)),
      summaries,
    };
  }

  async listDepartments(authUser: AuthUser) {
    const where = await this.rbac.buildEmployeeWhere(authUser);
    const rows = await this.prisma.employee.findMany({
      where: {
        AND: [where, { department: { not: null } }],
      },
      select: { department: true },
      distinct: ['department'],
      orderBy: { department: 'asc' },
    });

    return {
      data: rows
        .map((row) => row.department)
        .filter((department): department is string => Boolean(department)),
    };
  }

  async exportQueryReport(
    payload: ReportExportDto,
    authUser: AuthUser,
  ): Promise<{
    filename: string;
    content: string | Buffer;
    contentType: string;
  }> {
    const { employees } = await this.queryReport(payload, authUser);
    const exportRows = toReportQueryExportRows(employees);
    const filename = getReportExportFilename(payload.format);

    if (payload.format === 'csv') {
      return {
        filename,
        content: reportQueryRowsToCsv(exportRows),
        contentType: 'text/csv; charset=utf-8',
      };
    }

    return {
      filename,
      content: reportQueryRowsToExcelBuffer(exportRows),
      contentType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }

  async listEmployees(query: EmployeeReportQueryDto, authUser: AuthUser) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const where = await this.buildFilteredEmployeeWhere(query, authUser);

    const [total, data] = await this.prisma.$transaction([
      this.prisma.employee.count({ where }),
      this.prisma.employee.findMany({
        where,
        include: { city: { select: { id: true, code: true, name: true } } },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        skip,
        take: limit,
      }),
    ]);

    return {
      data: data.map((employee) => this.serializeReportEmployee(employee)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async exportEmployeesCsv(
    query: EmployeeReportQueryDto,
    authUser: AuthUser,
  ): Promise<{ filename: string; content: string }> {
    const where = await this.buildFilteredEmployeeWhere(query, authUser);

    const rows = await this.prisma.employee.findMany({
      where,
      include: { city: { select: { code: true, name: true } } },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      take: MAX_CSV_EXPORT_ROWS + 1,
    });

    if (rows.length > MAX_CSV_EXPORT_ROWS) {
      throw new ForbiddenException(
        `Export exceeds maximum of ${MAX_CSV_EXPORT_ROWS} rows. Narrow your filters.`,
      );
    }

    const content = rowsToCsv(rows, csvColumns);
    const stamp = new Date().toISOString().slice(0, 10);
    return { filename: `employees-${stamp}.csv`, content };
  }

  private async buildScopedEmployeeWhere(
    query: HeadcountQueryDto,
    authUser: AuthUser,
  ): Promise<Prisma.EmployeeWhereInput> {
    const scopeWhere = await this.rbac.buildEmployeeWhere(authUser);

    if (query.cityId) {
      const cityIds = await this.rbac.resolveCityIds(authUser);
      this.rbac.assertCityInScope(authUser, query.cityId, cityIds);
      return { AND: [scopeWhere, { cityId: query.cityId }] };
    }

    return scopeWhere;
  }

  private async buildFilteredEmployeeWhere(
    query: EmployeeReportQueryDto,
    authUser: AuthUser,
  ): Promise<Prisma.EmployeeWhereInput> {
    const filters: Prisma.EmployeeWhereInput[] = [
      await this.rbac.buildEmployeeWhere(authUser),
    ];

    if (query.cityId) {
      const cityIds = await this.rbac.resolveCityIds(authUser);
      this.rbac.assertCityInScope(authUser, query.cityId, cityIds);
      filters.push({ cityId: query.cityId });
    }

    if (query.employmentStatus) {
      filters.push({ employmentStatus: query.employmentStatus });
    }

    if (query.department?.trim()) {
      filters.push({
        department: { equals: query.department.trim(), mode: 'insensitive' },
      });
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

    return { AND: filters };
  }

  private async buildQuerySummaries(where: Prisma.EmployeeWhereInput) {
    const employeeSpouseFamiliesWhere: Prisma.EmployeeWhereInput = {
      AND: [
        where,
        {
          familyMembers: {
            some: {
              relationshipType: 'WORKER',
              deletedAt: null,
              family: {
                deletedAt: null,
                members: {
                  some: {
                    relationshipType: 'SPOUSE',
                    deletedAt: null,
                    employeeId: { not: null },
                  },
                },
              },
            },
          },
        },
      ],
    };

    const [byGender, byCity, byMaritalStatus, trainingCompletion, marriedEmployeeFamilies] =
      await Promise.all([
        this.prisma.employee.groupBy({
          by: ['gender'],
          where,
          _count: { _all: true },
          orderBy: { gender: 'asc' },
        }),
        this.prisma.employee.groupBy({
          by: ['cityId'],
          where,
          _count: { _all: true },
          orderBy: { cityId: 'asc' },
        }),
        this.prisma.employee.groupBy({
          by: ['maritalStatus'],
          where,
          _count: { _all: true },
          orderBy: { maritalStatus: 'asc' },
        }),
        this.prisma.employeeTraining.groupBy({
          by: ['status'],
          where: { employee: where },
          _count: { _all: true },
          orderBy: { status: 'asc' },
        }),
        this.prisma.employee.count({
          where: employeeSpouseFamiliesWhere,
        }),
      ]);

    const cityIds = byCity.map((row) => row.cityId);
    const cities =
      cityIds.length > 0
        ? await this.prisma.city.findMany({
            where: { id: { in: cityIds } },
            select: { id: true, code: true, name: true },
          })
        : [];
    const cityById = new Map(cities.map((city) => [city.id, city]));

    return {
      byGender: byGender.map((row) => ({
        gender: row.gender,
        label: formatReportEnumLabel(row.gender),
        count: row._count._all,
      })),
      byCity: byCity
        .map((row) => {
          const city = cityById.get(row.cityId);
          return {
            cityId: row.cityId,
            cityCode: city?.code ?? '—',
            cityName: city?.name ?? 'Unknown',
            count: row._count._all,
          };
        })
        .sort((a, b) => a.cityName.localeCompare(b.cityName)),
      byMaritalStatus: byMaritalStatus.map((row) => ({
        maritalStatus: row.maritalStatus,
        label: formatReportEnumLabel(row.maritalStatus),
        count: row._count._all,
      })),
      trainingCompletion: trainingCompletion.map((row) => ({
        status: row.status,
        label: formatTrainingStatusLabel(row.status),
        count: row._count._all,
      })),
      marriedEmployeeFamilies,
    };
  }

  private serializeReportEmployee(employee: {
    id: string;
    employeeNo: string;
    firstName: string;
    lastName: string;
    workEmail: string | null;
    jobTitle: string | null;
    department: string | null;
    gender: string | null;
    maritalStatus: string | null;
    employmentStatus: EmploymentStatus;
    hireDate: Date | null;
    city: { id: string; code: string; name: string };
  }) {
    return {
      id: employee.id,
      employeeNo: employee.employeeNo,
      firstName: employee.firstName,
      lastName: employee.lastName,
      fullName: `${employee.firstName} ${employee.lastName}`,
      workEmail: employee.workEmail,
      jobTitle: employee.jobTitle,
      department: employee.department,
      gender: employee.gender,
      maritalStatus: employee.maritalStatus,
      employmentStatus: employee.employmentStatus,
      hireDate: employee.hireDate?.toISOString().slice(0, 10) ?? null,
      city: employee.city,
    };
  }
}
