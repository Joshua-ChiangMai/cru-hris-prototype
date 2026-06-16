import { Injectable } from '@nestjs/common';
import {
  ApprovalChangeDomain,
  AuditAction,
  AuditEntity,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type AuditLogInput = {
  actorUserId: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string | null;
  entityLabel?: string | null;
  beforeValue?: unknown;
  afterValue?: unknown;
};

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async record(
    input: AuditLogInput,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx ?? this.prisma;

    await client.auditLog.create({
      data: {
        actorUserId: input.actorUserId,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        entityLabel: input.entityLabel ?? null,
        beforeValue: this.toJson(input.beforeValue),
        afterValue: this.toJson(input.afterValue),
      },
    });
  }

  resolveEntityFromDomain(
    changeDomain: ApprovalChangeDomain | null,
  ): AuditEntity {
    if (changeDomain === ApprovalChangeDomain.FAMILY_INFORMATION) {
      return AuditEntity.FAMILY;
    }

    return AuditEntity.EMPLOYEE_PROFILE;
  }

  resolveDataEntityId(
    changeDomain: ApprovalChangeDomain | null,
    targetEmployeeId: string,
    payloadAfter: Record<string, unknown>,
  ): string {
    if (changeDomain === ApprovalChangeDomain.FAMILY_INFORMATION) {
      const family = payloadAfter.family;
      if (family && typeof family === 'object' && 'id' in family) {
        return String((family as { id: string }).id);
      }
    }

    return targetEmployeeId;
  }

  mapApprovalAction(action: string): AuditAction | null {
    switch (action) {
      case 'SUBMIT':
        return AuditAction.SUBMIT;
      case 'APPROVE':
        return AuditAction.APPROVE;
      case 'REJECT':
        return AuditAction.REJECT;
      case 'CANCEL':
        return AuditAction.CANCEL;
      default:
        return null;
    }
  }

  private toJson(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
    if (value === undefined) {
      return Prisma.JsonNull;
    }

    return value as Prisma.InputJsonValue;
  }
}
