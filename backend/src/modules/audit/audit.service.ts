import { Injectable } from '@nestjs/common';
import { AuditAction, AuditEntity, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto';

const ENTITY_LABELS: Record<AuditEntity, string> = {
  [AuditEntity.EMPLOYEE_PROFILE]: 'Employee profile',
  [AuditEntity.FAMILY]: 'Family',
  [AuditEntity.UPDATE_REQUEST]: 'Update request',
};

const ACTION_LABELS: Record<AuditAction, string> = {
  [AuditAction.UPDATE]: 'Update',
  [AuditAction.SUBMIT]: 'Submit',
  [AuditAction.APPROVE]: 'Approve',
  [AuditAction.REJECT]: 'Reject',
  [AuditAction.CANCEL]: 'Cancel',
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async listLogs(query: ListAuditLogsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 25;
    const skip = (page - 1) * limit;
    const where = this.buildWhere(query);

    const [total, rows] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: { select: { id: true, email: true } },
        },
      }),
    ]);

    return {
      data: rows.map((row) => this.serializeLog(row)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  }

  async listFilterOptions() {
    const [actors, actions, entities] = await Promise.all([
      this.prisma.auditLog.findMany({
        distinct: ['actorUserId'],
        select: {
          actorUserId: true,
          actor: { select: { id: true, email: true } },
        },
        orderBy: { actor: { email: 'asc' } },
      }),
      this.prisma.auditLog.groupBy({
        by: ['action'],
        _count: { _all: true },
        orderBy: { action: 'asc' },
      }),
      this.prisma.auditLog.groupBy({
        by: ['entity'],
        _count: { _all: true },
        orderBy: { entity: 'asc' },
      }),
    ]);

    return {
      data: {
        actors: actors.map((row) => ({
          id: row.actor.id,
          email: row.actor.email,
        })),
        actions: actions.map((row) => ({
          value: row.action,
          label: ACTION_LABELS[row.action],
          count: row._count._all,
        })),
        entities: entities.map((row) => ({
          value: row.entity,
          label: ENTITY_LABELS[row.entity],
          count: row._count._all,
        })),
      },
    };
  }

  private buildWhere(query: ListAuditLogsQueryDto): Prisma.AuditLogWhereInput {
    const where: Prisma.AuditLogWhereInput = {};

    if (query.actorUserId) {
      where.actorUserId = query.actorUserId;
    }

    if (query.action) {
      where.action = query.action;
    }

    if (query.entity) {
      where.entity = query.entity;
    }

    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) {
        where.createdAt.gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        const end = new Date(query.dateTo);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    return where;
  }

  private serializeLog(
    row: Prisma.AuditLogGetPayload<{
      include: { actor: { select: { id: true; email: true } } };
    }>,
  ) {
    return {
      id: row.id,
      action: row.action,
      actionLabel: ACTION_LABELS[row.action],
      entity: row.entity,
      entityLabel: row.entityLabel ?? ENTITY_LABELS[row.entity],
      entityId: row.entityId,
      beforeValue: row.beforeValue,
      afterValue: row.afterValue,
      createdAt: row.createdAt.toISOString(),
      actor: {
        id: row.actor.id,
        email: row.actor.email,
      },
    };
  }
}
