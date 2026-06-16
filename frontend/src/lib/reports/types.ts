import type { EmploymentStatus } from "@/lib/employees/types";

export type CityCountSummary = {
  cityId: string;
  cityCode: string;
  cityName: string;
  employeeCount: number;
};

export type DashboardSummary = {
  employeeCount: number;
  pendingApprovals: number;
  citySummary: CityCountSummary[];
  scopeLevel: "OWN" | "CITY" | "ALL";
};

export type StatusCount = {
  status: string;
  count: number;
};

export type ReportStatistics = {
  totalEmployees: number;
  byEmploymentStatus: Array<{ status: EmploymentStatus; count: number }>;
  byCity: Array<{
    cityId: string;
    cityCode: string;
    cityName: string;
    count: number;
  }>;
  approvalByStatus: StatusCount[];
};

export type ReportEmployeeRow = {
  id: string;
  employeeNo: string;
  firstName: string;
  lastName: string;
  fullName: string;
  workEmail: string | null;
  jobTitle: string | null;
  employmentStatus: EmploymentStatus;
  hireDate: string | null;
  city: { id: string; code: string; name: string };
};

export type PaginatedReportEmployees = {
  data: ReportEmployeeRow[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type EmployeeReportFilters = {
  page?: number;
  limit?: number;
  search?: string;
  cityId?: string;
  employmentStatus?: EmploymentStatus;
};

export type ReportFilterField =
  | "gender"
  | "city"
  | "maritalStatus"
  | "department"
  | "employmentStatus"
  | "familySize"
  | "spouseExists"
  | "spouseIsEmployee"
  | "childrenCount"
  | "hasTraining"
  | "trainingCompleted"
  | "trainingName"
  | "trainingStatus";

export type ReportFilterOperator =
  | "eq"
  | "neq"
  | "gte"
  | "lte"
  | "gt"
  | "lt"
  | "contains";

export type ReportFilterPayload = {
  field: ReportFilterField;
  operator?: ReportFilterOperator;
  value: string | number | boolean;
};

export type ReportQueryRequest = {
  filters: ReportFilterPayload[];
};

export type ReportExportFormat = "csv" | "xlsx";

export type Gender = "MALE" | "FEMALE" | "NON_BINARY" | "PREFER_NOT_TO_SAY";

export type MaritalStatus =
  | "SINGLE"
  | "MARRIED"
  | "DIVORCED"
  | "WIDOWED"
  | "DOMESTIC_PARTNERSHIP";

export type TrainingStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "EXPIRED";

export type ReportQueryEmployee = {
  id: string;
  employeeNo: string;
  firstName: string;
  lastName: string;
  fullName: string;
  workEmail: string | null;
  jobTitle: string | null;
  department: string | null;
  gender: Gender | null;
  maritalStatus: MaritalStatus | null;
  employmentStatus: EmploymentStatus;
  hireDate: string | null;
  city: { id: string; code: string; name: string };
};

export type ReportCountSummary = {
  label: string;
  count: number;
};

export type ReportGenderSummary = ReportCountSummary & {
  gender: Gender | null;
};

export type ReportCitySummary = {
  cityId: string;
  cityCode: string;
  cityName: string;
  count: number;
};

export type ReportMaritalSummary = ReportCountSummary & {
  maritalStatus: MaritalStatus | null;
};

export type ReportTrainingSummary = ReportCountSummary & {
  status: TrainingStatus;
};

export type ReportQuerySummaries = {
  byGender: ReportGenderSummary[];
  byCity: ReportCitySummary[];
  byMaritalStatus: ReportMaritalSummary[];
  trainingCompletion: ReportTrainingSummary[];
  marriedEmployeeFamilies: number;
};

export type ReportQueryResponse = {
  total: number;
  employees: ReportQueryEmployee[];
  summaries: ReportQuerySummaries;
};

export type ReportDepartmentsResponse = {
  data: string[];
};
