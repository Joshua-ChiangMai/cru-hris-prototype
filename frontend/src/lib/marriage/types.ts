export type MarriageRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export type MarriageEmployeeSummary = {
  id: string;
  employeeNo: string;
  fullName: string;
  maritalStatus: string | null;
  city: { id: string; code: string; name: string };
};

export type MarriageRequest = {
  id: string;
  requestNo: string;
  status: MarriageRequestStatus;
  submittedAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  requester: MarriageEmployeeSummary;
  spouse: MarriageEmployeeSummary;
  city: { id: string; code: string; name: string };
  reviewedBy: { id: string; email: string } | null;
  canCancel?: boolean;
};

export type EligibleSpouse = {
  id: string;
  employeeNo: string;
  fullName: string;
  maritalStatus: string | null;
  city: { id: string; code: string; name: string };
};

export type ListMarriageRequestsParams = {
  page?: number;
  limit?: number;
  status?: MarriageRequestStatus;
  pendingOnly?: boolean;
};

export type PaginatedMarriageRequests = {
  data: MarriageRequest[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type MarriageRequestResponse = {
  data: MarriageRequest;
};

export type EligibleSpousesResponse = {
  data: EligibleSpouse[];
};
