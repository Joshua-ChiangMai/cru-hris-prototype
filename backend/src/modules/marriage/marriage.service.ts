import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MarriageRequestStatus, Prisma } from '@prisma/client';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { RbacService } from '../../common/services/rbac.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EmployeeScopeService } from '../employees/employee-scope.service';
import { ListMarriageRequestsQueryDto } from './dto/list-marriage-requests-query.dto';
import { RejectMarriageRequestDto } from './dto/reject-marriage-request.dto';
import { SubmitMarriageRequestDto } from './dto/submit-marriage-request.dto';
import { MarriageMergeService } from './marriage-merge.service';

const employeeSelect = {
  id: true,
  employeeNo: true,
  firstName: true,
  lastName: true,
  maritalStatus: true,
  city: { select: { id: true, code: true, name: true } },
} as const;

@Injectable()
export class MarriageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rbac: RbacService,
    private readonly employeeScope: EmployeeScopeService,
    private readonly marriageMerge: MarriageMergeService,
  ) {}

  async listMyRequests(
    query: ListMarriageRequestsQueryDto,
    authUser: AuthUser,
  ) {
    const employee = await this.requireLinkedEmployee(authUser);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.MarriageRequestWhereInput = {
      OR: [
        { requesterEmployeeId: employee.id },
        { spouseEmployeeId: employee.id },
      ],
    };

    if (query.status) {
      where.status = query.status;
    }

    const [total, rows] = await Promise.all([
      this.prisma.marriageRequest.count({ where }),
      this.prisma.marriageRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { submittedAt: 'desc' },
        include: this.requestInclude(),
      }),
    ]);

    return {
      data: rows.map((row) =>
        this.serializeRequest(row, {
          canCancel:
            row.status === MarriageRequestStatus.PENDING &&
            row.requesterEmployeeId === employee.id,
        }),
      ),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  }

  async listApprovalQueue(
    query: ListMarriageRequestsQueryDto,
    authUser: AuthUser,
  ) {
    if (!this.rbac.canReviewApprovals(authUser)) {
      throw new ForbiddenException('Only HR or Admin can review marriage requests');
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const where = await this.buildReviewQueueWhere(authUser);

    if (query.pendingOnly ?? true) {
      where.status = MarriageRequestStatus.PENDING;
    } else if (query.status) {
      where.status = query.status;
    }

    const [total, rows] = await Promise.all([
      this.prisma.marriageRequest.count({ where }),
      this.prisma.marriageRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { submittedAt: 'asc' },
        include: this.requestInclude(),
      }),
    ]);

    return {
      data: rows.map((row) => this.serializeRequest(row)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  }

  async getRequestById(id: string, authUser: AuthUser) {
    const request = await this.prisma.marriageRequest.findUnique({
      where: { id },
      include: this.requestInclude(),
    });

    if (!request) {
      throw new NotFoundException('Marriage request not found');
    }

    await this.assertCanAccessRequest(authUser, request);

    const employee = await this.prisma.employee.findFirst({
      where: { userId: authUser.userId, deletedAt: null },
      select: { id: true },
    });

    return {
      data: this.serializeRequest(request, {
        canCancel:
          request.status === MarriageRequestStatus.PENDING &&
          employee?.id === request.requesterEmployeeId,
      }),
    };
  }

  async listEligibleSpouses(authUser: AuthUser, search?: string) {
    const requester = await this.requireLinkedEmployee(authUser);
    const scopeWhere = await this.employeeScope.buildListWhere(authUser);

    const andFilters: Prisma.EmployeeWhereInput[] = [
      scopeWhere,
      { id: { not: requester.id } },
      { employmentStatus: 'ACTIVE' },
    ];

    if (search?.trim()) {
      const term = search.trim();
      andFilters.push({
        OR: [
          { firstName: { contains: term, mode: 'insensitive' } },
          { lastName: { contains: term, mode: 'insensitive' } },
          { employeeNo: { contains: term, mode: 'insensitive' } },
        ],
      });
    }

    const where: Prisma.EmployeeWhereInput = { AND: andFilters };

    const employees = await this.prisma.employee.findMany({
      where,
      select: employeeSelect,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      take: 50,
    });

    const filtered = [];
    for (const employee of employees) {
      const blocked = await this.hasBlockingMarriageState(
        requester.id,
        employee.id,
      );
      if (!blocked) {
        filtered.push(employee);
      }
    }

    return {
      data: filtered.map((employee) => ({
        id: employee.id,
        employeeNo: employee.employeeNo,
        fullName: `${employee.firstName} ${employee.lastName}`,
        maritalStatus: employee.maritalStatus,
        city: employee.city,
      })),
    };
  }

  async submitRequest(payload: SubmitMarriageRequestDto, authUser: AuthUser) {
    const requester = await this.requireLinkedEmployee(authUser);
    const spouse = await this.prisma.employee.findFirst({
      where: { id: payload.spouseEmployeeId, deletedAt: null },
      select: { id: true, cityId: true, firstName: true, lastName: true },
    });

    if (!spouse) {
      throw new NotFoundException('Spouse employee not found');
    }

    if (spouse.id === requester.id) {
      throw new BadRequestException('Cannot submit a marriage request to yourself');
    }

    await this.employeeScope.assertCanAccessEmployee(authUser, {
      id: spouse.id,
      userId: null,
      cityId: spouse.cityId,
    });

    if (authUser.scopeLevel === 'OWN' && requester.userId !== authUser.userId) {
      throw new ForbiddenException('Staff can only submit marriage requests for themselves');
    }

    await this.assertNoBlockingMarriageState(requester.id, spouse.id);

    const requestNo = await this.generateRequestNo();
    const created = await this.prisma.marriageRequest.create({
      data: {
        requestNo,
        requesterEmployeeId: requester.id,
        spouseEmployeeId: spouse.id,
        cityId: requester.cityId,
        status: MarriageRequestStatus.PENDING,
      },
      include: this.requestInclude(),
    });

    return { data: this.serializeRequest(created) };
  }

  async approveRequest(id: string, authUser: AuthUser) {
    const request = await this.getPendingRequestForReview(id, authUser);

    const approved = await this.prisma.$transaction(async (tx) => {
      await this.marriageMerge.applyMarriageMerge(
        request.requesterEmployeeId,
        request.spouseEmployeeId,
        tx,
      );

      return tx.marriageRequest.update({
        where: { id: request.id },
        data: {
          status: MarriageRequestStatus.APPROVED,
          reviewedByUserId: authUser.userId,
          approvedAt: new Date(),
          rejectionReason: null,
          rejectedAt: null,
        },
        include: this.requestInclude(),
      });
    });

    return { data: this.serializeRequest(approved) };
  }

  async rejectRequest(
    id: string,
    payload: RejectMarriageRequestDto,
    authUser: AuthUser,
  ) {
    const request = await this.getPendingRequestForReview(id, authUser);

    const rejected = await this.prisma.marriageRequest.update({
      where: { id: request.id },
      data: {
        status: MarriageRequestStatus.REJECTED,
        reviewedByUserId: authUser.userId,
        rejectedAt: new Date(),
        rejectionReason: payload.rejectionReason,
        approvedAt: null,
      },
      include: this.requestInclude(),
    });

    return { data: this.serializeRequest(rejected) };
  }

  async cancelRequest(id: string, authUser: AuthUser) {
    const request = await this.prisma.marriageRequest.findUnique({
      where: { id },
      include: this.requestInclude(),
    });

    if (!request) {
      throw new NotFoundException('Marriage request not found');
    }

    if (request.status !== MarriageRequestStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be cancelled');
    }

    const employee = await this.requireLinkedEmployee(authUser);
    if (request.requesterEmployeeId !== employee.id) {
      throw new ForbiddenException('Only the requester can cancel this request');
    }

    const cancelled = await this.prisma.marriageRequest.update({
      where: { id },
      data: { status: MarriageRequestStatus.CANCELLED },
      include: this.requestInclude(),
    });

    return { data: this.serializeRequest(cancelled) };
  }

  private async getPendingRequestForReview(id: string, authUser: AuthUser) {
    if (!this.rbac.canReviewApprovals(authUser)) {
      throw new ForbiddenException('Only HR or Admin can review marriage requests');
    }

    const request = await this.prisma.marriageRequest.findUnique({
      where: { id },
      include: this.requestInclude(),
    });

    if (!request) {
      throw new NotFoundException('Marriage request not found');
    }

    if (request.status !== MarriageRequestStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be reviewed');
    }

    await this.assertCanReviewRequest(authUser, request);
    return request;
  }

  private async buildReviewQueueWhere(authUser: AuthUser) {
    const where: Prisma.MarriageRequestWhereInput = {};

    if (authUser.scopeLevel === 'ALL') {
      return where;
    }

    if (authUser.scopeLevel === 'CITY') {
      const cityIds = await this.rbac.resolveCityIds(authUser);
      return {
        ...where,
        cityId: cityIds.length > 0 ? { in: cityIds } : { in: [] },
      };
    }

    return { ...where, id: { in: [] } };
  }

  private async assertCanAccessRequest(
    authUser: AuthUser,
    request: {
      requesterEmployeeId: string;
      spouseEmployeeId: string;
      cityId: string;
    },
  ) {
    if (authUser.scopeLevel === 'ALL') {
      return;
    }

    if (authUser.scopeLevel === 'CITY') {
      const cityIds = await this.rbac.resolveCityIds(authUser);
      if (cityIds.includes(request.cityId)) {
        return;
      }
      throw new ForbiddenException('Access denied to this marriage request');
    }

    const employee = await this.prisma.employee.findFirst({
      where: { userId: authUser.userId, deletedAt: null },
      select: { id: true },
    });

    if (
      employee &&
      (employee.id === request.requesterEmployeeId ||
        employee.id === request.spouseEmployeeId)
    ) {
      return;
    }

    throw new ForbiddenException('Access denied to this marriage request');
  }

  private async assertCanReviewRequest(
    authUser: AuthUser,
    request: { cityId: string },
  ) {
    if (authUser.scopeLevel === 'ALL') {
      return;
    }

    const cityIds = await this.rbac.resolveCityIds(authUser);
    if (!cityIds.includes(request.cityId)) {
      throw new ForbiddenException(
        'Marriage request is outside your assigned city scope',
      );
    }
  }

  private async assertNoBlockingMarriageState(
    requesterEmployeeId: string,
    spouseEmployeeId: string,
  ) {
    const blocked = await this.hasBlockingMarriageState(
      requesterEmployeeId,
      spouseEmployeeId,
    );
    if (blocked) {
      throw new BadRequestException(
        'A pending marriage request already exists or employees are already linked as spouses',
      );
    }
  }

  private async hasBlockingMarriageState(
    requesterEmployeeId: string,
    spouseEmployeeId: string,
  ): Promise<boolean> {
    const pending = await this.prisma.marriageRequest.findFirst({
      where: {
        status: MarriageRequestStatus.PENDING,
        OR: [
          { requesterEmployeeId, spouseEmployeeId },
          {
            requesterEmployeeId: spouseEmployeeId,
            spouseEmployeeId: requesterEmployeeId,
          },
        ],
      },
      select: { id: true },
    });

    if (pending) {
      return true;
    }

    const linkedSpouse = await this.prisma.familyMember.findFirst({
      where: {
        deletedAt: null,
        employeeId: spouseEmployeeId,
        relationshipType: 'SPOUSE',
      },
      select: { id: true },
    });

    return Boolean(linkedSpouse);
  }

  private async requireLinkedEmployee(authUser: AuthUser) {
    const employee = await this.prisma.employee.findFirst({
      where: { userId: authUser.userId, deletedAt: null },
      select: {
        id: true,
        userId: true,
        cityId: true,
        employeeNo: true,
        firstName: true,
        lastName: true,
        maritalStatus: true,
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee profile not linked to this user');
    }

    return employee;
  }

  private async generateRequestNo(): Promise<string> {
    const count = await this.prisma.marriageRequest.count();
    return `MR-${String(count + 1).padStart(5, '0')}`;
  }

  private requestInclude() {
    return {
      requester: { select: employeeSelect },
      spouse: { select: employeeSelect },
      city: { select: { id: true, code: true, name: true } },
      reviewedBy: { select: { id: true, email: true } },
    };
  }

  private serializeRequest(
    request: Prisma.MarriageRequestGetPayload<{
      include: ReturnType<MarriageService['requestInclude']>;
    }>,
    extras?: { canCancel?: boolean },
  ) {
    return {
      id: request.id,
      requestNo: request.requestNo,
      status: request.status,
      submittedAt: request.submittedAt.toISOString(),
      approvedAt: request.approvedAt?.toISOString() ?? null,
      rejectedAt: request.rejectedAt?.toISOString() ?? null,
      rejectionReason: request.rejectionReason,
      requester: {
        id: request.requester.id,
        employeeNo: request.requester.employeeNo,
        fullName: `${request.requester.firstName} ${request.requester.lastName}`,
        maritalStatus: request.requester.maritalStatus,
        city: request.requester.city,
      },
      spouse: {
        id: request.spouse.id,
        employeeNo: request.spouse.employeeNo,
        fullName: `${request.spouse.firstName} ${request.spouse.lastName}`,
        maritalStatus: request.spouse.maritalStatus,
        city: request.spouse.city,
      },
      city: request.city,
      reviewedBy: request.reviewedBy
        ? { id: request.reviewedBy.id, email: request.reviewedBy.email }
        : null,
      canCancel: extras?.canCancel ?? false,
    };
  }
}
