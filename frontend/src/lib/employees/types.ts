export type EmploymentStatus = "ACTIVE" | "INACTIVE" | "TERMINATED";

export type CitySummary = {
  id: string;
  code: string;
  name: string;
};

export type ManagerSummary = {
  id: string;
  employeeNo: string;
  firstName: string;
  lastName: string;
} | null;

export type EmployeeListItem = {
  id: string;
  employeeNo: string;
  firstName: string;
  lastName: string;
  fullName: string;
  workEmail: string | null;
  phone: string | null;
  jobTitle: string | null;
  employmentStatus: EmploymentStatus;
  hireDate: string | null;
  city: CitySummary;
  manager: ManagerSummary;
  canEdit: boolean;
};

export type EmployeeDetail = EmployeeListItem & {
  managerEmployeeId: string | null;
  cityId: string;
  userId: string | null;
  directReports: Array<{
    id: string;
    employeeNo: string;
    firstName: string;
    lastName: string;
    employmentStatus: EmploymentStatus;
  }>;
  canEditAllFields: boolean;
};

export type PaginatedEmployees = {
  data: EmployeeListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type EmployeeListParams = {
  page?: number;
  limit?: number;
  search?: string;
  cityId?: string;
  employmentStatus?: EmploymentStatus;
};

export type UpdateEmployeePayload = Partial<{
  employeeNo: string;
  cityId: string;
  managerEmployeeId: string | null;
  firstName: string;
  lastName: string;
  workEmail: string;
  phone: string;
  jobTitle: string;
  employmentStatus: EmploymentStatus;
  hireDate: string;
}>;
