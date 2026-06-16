export type AuditAction =
  | "UPDATE"
  | "SUBMIT"
  | "APPROVE"
  | "REJECT"
  | "CANCEL";

export type AuditEntity =
  | "EMPLOYEE_PROFILE"
  | "FAMILY"
  | "UPDATE_REQUEST";

export type AuditLogEntry = {
  id: string;
  action: AuditAction;
  actionLabel: string;
  entity: AuditEntity;
  entityLabel: string;
  entityId: string | null;
  beforeValue: unknown;
  afterValue: unknown;
  createdAt: string;
  actor: {
    id: string;
    email: string;
  };
};

export type ListAuditLogsParams = {
  page?: number;
  limit?: number;
  actorUserId?: string;
  action?: AuditAction;
  entity?: AuditEntity;
  dateFrom?: string;
  dateTo?: string;
};

export type PaginatedAuditLogs = {
  data: AuditLogEntry[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type AuditFilterOptions = {
  actors: Array<{ id: string; email: string }>;
  actions: Array<{ value: AuditAction; label: string; count: number }>;
  entities: Array<{ value: AuditEntity; label: string; count: number }>;
};
