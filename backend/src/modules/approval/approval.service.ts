import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ApprovalAction,
  ApprovalChangeDomain,
  AuditAction,
  AuditEntity,
  Prisma,
  UpdateRequestStatus,
  UpdateRequestType,
} from '@prisma/client';
import { AuditLogService } from '../../common/services/audit-log.service';
import { DOMAIN_LABELS } from '../../common/constants/approval-change-domains';
import { randomBytes } from 'crypto';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { EmployeeScopeService } from '../employees/employee-scope.service';
import { ApprovalScopeService } from './approval-scope.service';
import { CreateUpdateRequestDto } from './dto/create-update-request.dto';
import { ListApprovalQueryDto } from './dto/list-approval-query.dto';
import { RejectRequestDto } from './dto/reject-request.dto';
import { ReviewRequestDto } from './dto/review-request.dto';
import { SubmitSensitiveUpdateRequestDto } from './dto/submit-sensitive-update-request.dto';
import { ProfileSnapshotService } from '../../common/services/profile-snapshot.service';
import { SensitiveFieldsService } from '../../common/services/sensitive-fields.service';
import { ProfileService } from '../profile/profile.service';
import { SubmitProfileUpdateRequestDto } from '../profile/dto/submit-profile-update-request.dto';
import { FamilyService } from '../family/family.service';
import { UpdateFamilyDto } from '../family/dto/update-family.dto';
import { ApprovalChangeService } from './approval-change.service';
import { SubmitChangeRequestDto } from './dto/submit-change-request.dto';

const requestInclude = {
  requester: {
    select: {
      id: true,
      employeeNo: true,
      firstName: true,
      lastName: true,
      userId: true,
    },
  },
  targetEmployee: {
    select: {
      id: true,
      employeeNo: true,
      firstName: true,
      lastName: true,
    },
  },
  city: { select: { id: true, code: true, name: true } },
  assignedApprover: { select: { id: true, email: true } },
  approvalLogs: {
    orderBy: { createdAt: 'asc' as const },
    include: {
      actorUser: { select: { id: true, email: true } },
    },
  },
} satisfies Prisma.UpdateRequestInclude;

type AuditContext = {
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
};

@Injectable()
export class ApprovalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scopeService: ApprovalScopeService,
    private readonly employeeScope: EmployeeScopeService,
    private readonly sensitiveFields: SensitiveFieldsService,
    private readonly profileSnapshot: ProfileSnapshotService,
    private readonly profileService: ProfileService,
    private readonly familyService: FamilyService,
    private readonly approvalChange: ApprovalChangeService,
    private readonly auditLog: AuditLogService,
  ) {}

  async submitChangeRequest(
    payload: SubmitChangeRequestDto,
    authUser: AuthUser,
    audit?: AuditContext,
  ) {
    const targetEmployee = await this.prisma.employee.findFirst({
      where: { id: payload.targetEmployeeId, deletedAt: null },
    });

    if (!targetEmployee) {
      throw new NotFoundException('Target employee not found');
    }

    await this.employeeScope.assertCanAccessEmployee(authUser, targetEmployee);

    if (
      this.approvalChange.payloadsEqual(
        payload.payloadBefore,
        payload.payloadAfter,
      )
    ) {
      throw new BadRequestException('No changes detected in submission');
    }

    const requesterEmployee = await this.getRequesterEmployee(authUser);

    if (
      authUser.scopeLevel === 'OWN' &&
      targetEmployee.id !== requesterEmployee.id
    ) {
      throw new ForbiddenException('Staff can only submit changes for own profile');
    }

    return this.createRequestInternal(
      {
        requestType: UpdateRequestType.PROFILE_UPDATE,
        changeDomain: payload.changeDomain,
        changeSummary:
          payload.changeSummary ??
          DOMAIN_LABELS[payload.changeDomain],
        requesterEmployeeId: requesterEmployee.id,
        targetEmployeeId: targetEmployee.id,
        cityId: targetEmployee.cityId,
        payloadBefore: payload.payloadBefore,
        payloadAfter: payload.payloadAfter,
        comment: payload.comment,
      },
      authUser,
      audit,
    );
  }

  async submitFamilyUpdate(
    targetEmployeeId: string,
    familyPayload: UpdateFamilyDto,
    authUser: AuthUser,
    audit?: AuditContext,
    comment?: string,
  ) {
    const beforeFamily =
      await this.familyService.getFamilyPayloadForEmployee(targetEmployeeId);

    if (!beforeFamily) {
      throw new NotFoundException('Family record not found for employee');
    }

    const afterFamily = this.familyService.mergeFamilyUpdate(
      beforeFamily,
      familyPayload,
    );

    return this.submitChangeRequest(
      {
        targetEmployeeId,
        changeDomain: ApprovalChangeDomain.FAMILY_INFORMATION,
        changeSummary: DOMAIN_LABELS[ApprovalChangeDomain.FAMILY_INFORMATION],
        payloadBefore: { family: beforeFamily },
        payloadAfter: { family: afterFamily },
        comment,
      },
      authUser,
      audit,
    );
  }

  async submitProfileUpdate(
    payload: SubmitProfileUpdateRequestDto,
    authUser: AuthUser,
    audit?: AuditContext,
  ) {
    const targetEmployee = await this.prisma.employee.findFirst({
      where: { id: payload.targetEmployeeId, deletedAt: null },
    });

    if (!targetEmployee) {
      throw new NotFoundException('Target employee not found');
    }

    await this.employeeScope.assertCanAccessEmployee(authUser, targetEmployee);

    const loaded = await this.profileSnapshot.loadEmployeeWithProfile(
      targetEmployee.id,
    );
    if (!loaded) {
      throw new NotFoundException('Target employee not found');
    }

    const domain = this.resolveProfileChangeDomain(payload.profile);
    if (!domain) {
      throw new BadRequestException(
        'Profile submission must include Personal, Contact, or Passport changes',
      );
    }

    const before = this.extractDomainSnapshot(
      this.profileSnapshot.serializeProfile(loaded),
      domain,
    );
    const merged = this.profileService.mergeProfileUpdate(
      this.profileSnapshot.serializeProfile(loaded),
      payload.profile,
    );
    const after = this.extractDomainSnapshot(merged, domain);

    return this.submitChangeRequest(
      {
        targetEmployeeId: payload.targetEmployeeId,
        changeDomain: domain,
        changeSummary: DOMAIN_LABELS[domain],
        payloadBefore: before,
        payloadAfter: after,
        comment: payload.comment,
      },
      authUser,
      audit,
    );
  }

  private resolveProfileChangeDomain(
    profile: SubmitProfileUpdateRequestDto['profile'],
  ): ApprovalChangeDomain | null {
    if (profile.basic) {
      return ApprovalChangeDomain.PERSONAL_INFORMATION;
    }
    if (profile.contact) {
      return ApprovalChangeDomain.CONTACT_INFORMATION;
    }
    if (profile.passports) {
      return ApprovalChangeDomain.PASSPORT_INFORMATION;
    }
    return null;
  }

  private extractDomainSnapshot(
    profile: ReturnType<ProfileSnapshotService['serializeProfile']>,
    domain: ApprovalChangeDomain,
  ): Record<string, unknown> {
    switch (domain) {
      case ApprovalChangeDomain.PERSONAL_INFORMATION:
        return { basic: profile.basic };
      case ApprovalChangeDomain.CONTACT_INFORMATION:
        return { contact: profile.contact };
      case ApprovalChangeDomain.PASSPORT_INFORMATION:
        return { passports: profile.passports };
      default:
        return { profile };
    }
  }

  async listRequests(query: ListApprovalQueryDto, authUser: AuthUser) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const scopeWhere = await this.scopeService.buildListWhere(authUser);
    const filters: Prisma.UpdateRequestWhereInput[] = [scopeWhere];

    if (query.history) {
      filters.push({
        status: {
          in: [
            UpdateRequestStatus.APPROVED,
            UpdateRequestStatus.REJECTED,
            UpdateRequestStatus.CANCELLED,
          ],
        },
      });
    } else if (query.pendingOnly) {
      filters.push({ status: UpdateRequestStatus.PENDING });
    } else if (query.status) {
      filters.push({ status: query.status });
    }

    if (query.changeDomain) {
      filters.push({ changeDomain: query.changeDomain });
    }

    if (query.cityId) {
      if (authUser.scopeLevel === 'CITY') {
        const cityIds = await this.employeeScope.resolveCityIds(authUser);
        if (!cityIds.includes(query.cityId)) {
          throw new ForbiddenException('City filter outside your scope');
        }
      }
      filters.push({ cityId: query.cityId });
    }

    const where: Prisma.UpdateRequestWhereInput = { AND: filters };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.updateRequest.count({ where }),
      this.prisma.updateRequest.findMany({
        where,
        include: requestInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: data.map((item) => this.toResponse(item, authUser)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  async getRequestById(id: string, authUser: AuthUser) {
    const request = await this.findRequestOrThrow(id);
    await this.scopeService.assertCanAccessRequest(authUser, request);
    return this.toResponse(request, authUser);
  }

  async submitSensitiveUpdate(
    payload: SubmitSensitiveUpdateRequestDto,
    authUser: AuthUser,
    audit?: AuditContext,
  ) {
    const targetEmployee = await this.prisma.employee.findFirst({
      where: { id: payload.targetEmployeeId, deletedAt: null },
    });

    if (!targetEmployee) {
      throw new NotFoundException('Target employee not found');
    }

    await this.employeeScope.assertCanAccessEmployee(authUser, targetEmployee);

    const before = this.sensitiveFields.buildEmployeeSnapshot(targetEmployee);
    const sensitiveChanges = this.sensitiveFields.extractSensitiveChanges(
      before,
      payload.changes,
    );

    if (Object.keys(sensitiveChanges).length === 0) {
      throw new BadRequestException('No sensitive field changes detected');
    }

    if (
      this.employeeScope.canEditAllFields(authUser) &&
      targetEmployee.userId !== authUser.userId
    ) {
      throw new BadRequestException(
        'Use employee update API for direct changes to other employees.',
      );
    }

    const requesterEmployee = await this.getRequesterEmployee(authUser);

    if (
      authUser.scopeLevel === 'OWN' &&
      targetEmployee.id !== requesterEmployee.id
    ) {
      throw new ForbiddenException('Staff can only submit changes for own profile');
    }

    return this.createRequestInternal(
      {
        requestType: UpdateRequestType.SENSITIVE_FIELD_UPDATE,
        requesterEmployeeId: requesterEmployee.id,
        targetEmployeeId: targetEmployee.id,
        cityId: targetEmployee.cityId,
        payloadBefore: before,
        payloadAfter: { ...before, ...sensitiveChanges },
        comment: payload.comment,
      },
      authUser,
      audit,
    );
  }

  async createRequest(
    payload: CreateUpdateRequestDto,
    authUser: AuthUser,
    audit?: AuditContext,
  ) {
    const requesterEmployee = await this.getRequesterEmployee(authUser);
    const targetEmployee = await this.prisma.employee.findFirst({
      where: { id: payload.targetEmployeeId, deletedAt: null },
    });

    if (!targetEmployee) {
      throw new NotFoundException('Target employee not found');
    }

    await this.employeeScope.assertCanAccessEmployee(authUser, targetEmployee);

    const before = this.sensitiveFields.buildEmployeeSnapshot(targetEmployee);

    return this.createRequestInternal(
      {
        requestType: payload.requestType,
        requesterEmployeeId: requesterEmployee.id,
        targetEmployeeId: targetEmployee.id,
        cityId: targetEmployee.cityId,
        payloadBefore: before,
        payloadAfter: payload.payloadAfter as Record<string, unknown>,
        assignedApproverUserId: payload.assignedApproverUserId,
      },
      authUser,
      audit,
    );
  }

  async approveRequest(
    requestId: string,
    payload: ReviewRequestDto,
    authUser: AuthUser,
    audit?: AuditContext,
  ) {
    this.assertCanReview(authUser);

    return this.transition(
      requestId,
      authUser,
      {
        action: ApprovalAction.APPROVE,
        fromStatus: UpdateRequestStatus.PENDING,
        toStatus: UpdateRequestStatus.APPROVED,
        comment: payload.comment,
        applyTargetUpdate: true,
      },
      audit,
    );
  }

  async rejectRequest(
    requestId: string,
    payload: RejectRequestDto,
    authUser: AuthUser,
    audit?: AuditContext,
  ) {
    this.assertCanReview(authUser);

    return this.transition(
      requestId,
      authUser,
      {
        action: ApprovalAction.REJECT,
        fromStatus: UpdateRequestStatus.PENDING,
        toStatus: UpdateRequestStatus.REJECTED,
        comment: payload.comment,
        applyTargetUpdate: false,
        rejectionReason: payload.comment,
      },
      audit,
    );
  }

  async cancelRequest(
    requestId: string,
    payload: ReviewRequestDto,
    authUser: AuthUser,
    audit?: AuditContext,
  ) {
    const request = await this.findRequestOrThrow(requestId);
    await this.scopeService.assertCanAccessRequest(authUser, request);

    const requester = await this.prisma.employee.findUnique({
      where: { id: request.requesterEmployeeId },
      select: { userId: true },
    });

    if (requester?.userId !== authUser.userId && authUser.scopeLevel !== 'ALL') {
      throw new ForbiddenException('Only the requester can cancel this request');
    }

    return this.transition(
      requestId,
      authUser,
      {
        action: ApprovalAction.CANCEL,
        fromStatus: UpdateRequestStatus.PENDING,
        toStatus: UpdateRequestStatus.CANCELLED,
        comment: payload.comment,
        applyTargetUpdate: false,
      },
      audit,
    );
  }

  private async createRequestInternal(
    params: {
      requestType: UpdateRequestType;
      changeDomain?: ApprovalChangeDomain | null;
      changeSummary?: string;
      requesterEmployeeId: string;
      targetEmployeeId: string;
      cityId: string;
      payloadBefore: Record<string, unknown>;
      payloadAfter: Record<string, unknown>;
      assignedApproverUserId?: string;
      comment?: string;
    },
    authUser: AuthUser,
    audit?: AuditContext,
  ) {
    const pendingWhere: Prisma.UpdateRequestWhereInput = {
      targetEmployeeId: params.targetEmployeeId,
      status: UpdateRequestStatus.PENDING,
      deletedAt: null,
    };

    if (params.changeDomain) {
      pendingWhere.changeDomain = params.changeDomain;
    }

    const pendingExists = await this.prisma.updateRequest.findFirst({
      where: pendingWhere,
    });

    if (pendingExists) {
      throw new ConflictException(
        params.changeDomain
          ? `A pending ${DOMAIN_LABELS[params.changeDomain]} request already exists`
          : 'A pending update request already exists for this employee',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const request = await tx.updateRequest.create({
        data: {
          requestNo: this.generateRequestNo(),
          requestType: params.requestType,
          changeDomain: params.changeDomain ?? null,
          changeSummary: params.changeSummary ?? null,
          requesterEmployeeId: params.requesterEmployeeId,
          targetEmployeeId: params.targetEmployeeId,
          assignedApproverUserId: params.assignedApproverUserId ?? null,
          cityId: params.cityId,
          status: UpdateRequestStatus.PENDING,
          payloadBefore: params.payloadBefore as Prisma.InputJsonValue,
          payloadAfter: params.payloadAfter as Prisma.InputJsonValue,
          submittedAt: new Date(),
        },
        include: requestInclude,
      });

      await tx.approvalLog.create({
        data: {
          updateRequestId: request.id,
          actorUserId: authUser.userId,
          action: ApprovalAction.SUBMIT,
          fromStatus: null,
          toStatus: UpdateRequestStatus.PENDING,
          comment: params.comment,
          metadata: { source: 'approval.submit' },
          ipAddress: audit?.ipAddress,
          userAgent: audit?.userAgent,
          correlationId: audit?.correlationId,
        },
      });

      await this.auditLog.record(
        {
          actorUserId: authUser.userId,
          action: AuditAction.SUBMIT,
          entity: AuditEntity.UPDATE_REQUEST,
          entityId: request.id,
          entityLabel: request.requestNo,
          beforeValue: params.payloadBefore,
          afterValue: params.payloadAfter,
        },
        tx,
      );

      const dataEntity = this.auditLog.resolveEntityFromDomain(
        params.changeDomain ?? null,
      );
      await this.auditLog.record(
        {
          actorUserId: authUser.userId,
          action: AuditAction.SUBMIT,
          entity: dataEntity,
          entityId: this.auditLog.resolveDataEntityId(
            params.changeDomain ?? null,
            params.targetEmployeeId,
            params.payloadAfter,
          ),
          entityLabel: params.changeSummary ?? request.requestNo,
          beforeValue: params.payloadBefore,
          afterValue: params.payloadAfter,
        },
        tx,
      );

      return this.toResponse(request, authUser);
    });
  }

  private async transition(
    requestId: string,
    authUser: AuthUser,
    params: {
      action: ApprovalAction;
      fromStatus: UpdateRequestStatus;
      toStatus: UpdateRequestStatus;
      comment?: string;
      applyTargetUpdate: boolean;
      rejectionReason?: string;
    },
    audit?: AuditContext,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.updateRequest.findFirst({
        where: { id: requestId, deletedAt: null },
        include: { requester: { select: { userId: true } } },
      });

      if (!request) {
        throw new NotFoundException('Update request not found');
      }

      await this.scopeService.assertCanAccessRequest(authUser, {
        cityId: request.cityId,
        requesterEmployeeId: request.requesterEmployeeId,
        requester: request.requester,
      });

      if (request.status !== params.fromStatus) {
        throw new ConflictException(
          `Cannot ${params.action.toLowerCase()} request in status ${request.status}`,
        );
      }

      if (params.applyTargetUpdate) {
        const payload = request.payloadAfter as Record<string, unknown>;
        await this.approvalChange.applyApprovedChange(
          request.targetEmployeeId,
          request.changeDomain,
          payload,
        );
      }

      const updatedRequest = await tx.updateRequest.update({
        where: { id: request.id },
        data: {
          status: params.toStatus,
          resolvedAt: new Date(),
          rejectionReason: params.rejectionReason,
          version: { increment: 1 },
        },
        include: requestInclude,
      });

      await tx.approvalLog.create({
        data: {
          updateRequestId: request.id,
          actorUserId: authUser.userId,
          action: params.action,
          fromStatus: params.fromStatus,
          toStatus: params.toStatus,
          comment: params.comment,
          metadata: { source: `approval.${params.action.toLowerCase()}` },
          ipAddress: audit?.ipAddress,
          userAgent: audit?.userAgent,
          correlationId: audit?.correlationId,
        },
      });

      const auditAction = this.auditLog.mapApprovalAction(params.action);
      if (auditAction) {
        await this.auditLog.record(
          {
            actorUserId: authUser.userId,
            action: auditAction,
            entity: AuditEntity.UPDATE_REQUEST,
            entityId: request.id,
            entityLabel: updatedRequest.requestNo,
            beforeValue: {
              status: params.fromStatus,
              payload: request.payloadBefore,
            },
            afterValue: {
              status: params.toStatus,
              payload: request.payloadAfter,
              comment: params.comment ?? params.rejectionReason ?? null,
            },
          },
          tx,
        );
      }

      if (params.applyTargetUpdate) {
        const payload = request.payloadAfter as Record<string, unknown>;
        const dataEntity = this.auditLog.resolveEntityFromDomain(
          request.changeDomain,
        );

        await this.auditLog.record(
          {
            actorUserId: authUser.userId,
            action: AuditAction.UPDATE,
            entity: dataEntity,
            entityId: this.auditLog.resolveDataEntityId(
              request.changeDomain,
              request.targetEmployeeId,
              payload,
            ),
            entityLabel:
              updatedRequest.changeSummary ?? updatedRequest.requestNo,
            beforeValue: request.payloadBefore,
            afterValue: request.payloadAfter,
          },
          tx,
        );
      }

      return this.toResponse(updatedRequest, authUser);
    });
  }

  private buildEmployeeUpdateFromPayload(
    payload: Record<string, unknown>,
  ): Prisma.EmployeeUpdateInput {
    const data: Prisma.EmployeeUpdateInput = {};

    if (payload.employeeNo !== undefined) {
      data.employeeNo = String(payload.employeeNo);
    }
    if (payload.firstName !== undefined) {
      data.firstName = String(payload.firstName);
    }
    if (payload.lastName !== undefined) {
      data.lastName = String(payload.lastName);
    }
    if (payload.workEmail !== undefined) {
      data.workEmail = payload.workEmail ? String(payload.workEmail) : null;
    }
    if (payload.employmentStatus !== undefined) {
      data.employmentStatus = payload.employmentStatus as never;
    }
    if (payload.cityId !== undefined) {
      data.city = { connect: { id: String(payload.cityId) } };
    }
    if (payload.hireDate !== undefined) {
      data.hireDate = payload.hireDate
        ? new Date(String(payload.hireDate))
        : null;
    }
    if (payload.managerEmployeeId !== undefined) {
      data.manager = payload.managerEmployeeId
        ? { connect: { id: String(payload.managerEmployeeId) } }
        : { disconnect: true };
    }
    if (payload.phone !== undefined) {
      data.phone = payload.phone ? String(payload.phone) : null;
    }
    if (payload.jobTitle !== undefined) {
      data.jobTitle = payload.jobTitle ? String(payload.jobTitle) : null;
    }
    if (payload.department !== undefined) {
      data.department = payload.department ? String(payload.department) : null;
    }

    return data;
  }

  private async findRequestOrThrow(id: string) {
    const request = await this.prisma.updateRequest.findFirst({
      where: { id, deletedAt: null },
      include: requestInclude,
    });

    if (!request) {
      throw new NotFoundException('Update request not found');
    }

    return request;
  }

  private async getRequesterEmployee(authUser: AuthUser) {
    const requesterEmployee = await this.prisma.employee.findFirst({
      where: { userId: authUser.userId, deletedAt: null },
    });

    if (!requesterEmployee) {
      throw new NotFoundException('Requester employee profile not found');
    }

    return requesterEmployee;
  }

  private assertCanReview(authUser: AuthUser): void {
    if (!this.scopeService.canReview(authUser)) {
      throw new ForbiddenException('Only HR/Admin can approve or reject requests');
    }
  }

  private generateRequestNo(): string {
    return `REQ-${Date.now()}-${randomBytes(3).toString('hex').toUpperCase()}`;
  }

  private toResponse(
    request: Prisma.UpdateRequestGetPayload<{ include: typeof requestInclude }>,
    authUser: AuthUser,
  ) {
    return {
      id: request.id,
      requestNo: request.requestNo,
      requestType: request.requestType,
      changeDomain: request.changeDomain,
      changeSummary: request.changeSummary,
      status: request.status,
      requester: request.requester,
      targetEmployee: request.targetEmployee,
      city: request.city,
      assignedApprover: request.assignedApprover,
      payloadBefore: request.payloadBefore,
      payloadAfter: request.payloadAfter,
      rejectionReason: request.rejectionReason,
      submittedAt: request.submittedAt,
      resolvedAt: request.resolvedAt,
      createdAt: request.createdAt,
      approvalLogs: request.approvalLogs,
      canReview:
        this.scopeService.canReview(authUser) &&
        request.status === UpdateRequestStatus.PENDING,
      canCancel:
        request.status === UpdateRequestStatus.PENDING &&
        request.requester.userId === authUser.userId,
    };
  }
}
