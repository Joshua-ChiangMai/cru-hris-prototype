export type FamilyRelationship =
  | "WORKER"
  | "SPOUSE"
  | "SON"
  | "DAUGHTER"
  | "PARENT";

export type FamilyMember = {
  id: string;
  familyId: string;
  relationshipType: FamilyRelationship;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth: string | null;
  employeeId: string | null;
  employeeNo: string | null;
  workEmail: string | null;
  jobTitle: string | null;
  department: string | null;
  city: { id: string; code: string; name: string } | null;
};

export type FamilySummary = {
  id: string;
  rcNumber: string;
  displayName: string;
  memberCount: number;
  spouseIsEmployee?: boolean;
  employeeSpouse?: {
    id: string;
    employeeId: string | null;
    employeeNo: string | null;
    fullName: string;
  } | null;
  worker: {
    id: string;
    firstName: string;
    lastName: string;
    employeeNo: string | null;
    city: { id: string; code: string; name: string } | null;
  } | null;
  members: FamilyMember[];
};

export type FamilyDetail = FamilySummary & {
  relationships: Record<FamilyRelationship, number>;
};

export type ListFamiliesParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export type PaginatedFamilies = {
  data: FamilySummary[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
