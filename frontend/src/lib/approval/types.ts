export type UpdateRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export type UpdateRequestType =
  | "PROFILE_UPDATE"
  | "SENSITIVE_FIELD_UPDATE";

export type ApprovalChangeDomain =
  | "PERSONAL_INFORMATION"
  | "CONTACT_INFORMATION"
  | "FAMILY_INFORMATION"
  | "PASSPORT_INFORMATION";

export type ApprovalLog = {
  id: string;
  action: string;
  fromStatus: UpdateRequestStatus | null;
  toStatus: UpdateRequestStatus | null;
  comment: string | null;
  createdAt: string;
  actorUser: { id: string; email: string };
};

export type UpdateRequest = {
  id: string;
  requestNo: string;
  requestType: UpdateRequestType;
  changeDomain: ApprovalChangeDomain | null;
  changeSummary: string | null;
  status: UpdateRequestStatus;
  requester: {
    id: string;
    employeeNo: string;
    firstName: string;
    lastName: string;
    userId: string | null;
  };
  targetEmployee: {
    id: string;
    employeeNo: string;
    firstName: string;
    lastName: string;
  };
  city: { id: string; code: string; name: string };
  payloadBefore: Record<string, unknown> | null;
  payloadAfter: Record<string, unknown>;
  rejectionReason: string | null;
  submittedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  approvalLogs: ApprovalLog[];
  canReview: boolean;
  canCancel: boolean;
};

export type PaginatedUpdateRequests = {
  data: UpdateRequest[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ListApprovalParams = {
  page?: number;
  limit?: number;
  status?: UpdateRequestStatus;
  cityId?: string;
  changeDomain?: ApprovalChangeDomain;
  history?: boolean;
  pendingOnly?: boolean;
};
