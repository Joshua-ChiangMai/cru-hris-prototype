export type Gender =
  | "MALE"
  | "FEMALE"
  | "NON_BINARY"
  | "PREFER_NOT_TO_SAY";

export type MaritalStatus =
  | "SINGLE"
  | "MARRIED"
  | "DIVORCED"
  | "WIDOWED"
  | "DOMESTIC_PARTNERSHIP";

export type WorkerType =
  | "FULL_TIME"
  | "PART_TIME"
  | "INTERN"
  | "VOLUNTEER"
  | "CONTRACT";

export type WorkerStatus = "ACTIVE" | "ON_LEAVE" | "INACTIVE" | "TERMINATED";

export type LanguageProficiency =
  | "BASIC"
  | "CONVERSATIONAL"
  | "FLUENT"
  | "NATIVE";

export type EmployeeProfile = {
  employeeId: string;
  basic: {
    firstName: string;
    lastName: string;
    preferredName: string | null;
    dateOfBirth: string | null;
    gender: Gender | null;
    maritalStatus: MaritalStatus | null;
    citizenship: string | null;
    rcNumber: string | null;
  };
  contact: {
    primaryAddressLine1: string | null;
    primaryAddressLine2: string | null;
    primaryCity: string | null;
    primaryState: string | null;
    primaryPostalCode: string | null;
    primaryCountry: string | null;
    mailingAddressLine1: string | null;
    mailingAddressLine2: string | null;
    mailingCity: string | null;
    mailingState: string | null;
    mailingPostalCode: string | null;
    mailingCountry: string | null;
    phonePrimary: string | null;
    phoneSecondary: string | null;
    emailPrimary: string | null;
    emailSecondary: string | null;
    signalAccount: string | null;
  };
  worker: {
    workerType: WorkerType | null;
    workerStatus: WorkerStatus | null;
    internStartDate: string | null;
    ministryJoinDate: string | null;
    workerJoinDate: string | null;
    terminationDate: string | null;
    sendingRegion: string | null;
    salarySource: string | null;
  };
  teamAssignments: Array<{
    id: string;
    team: string;
    position: string;
    startDate: string;
    endDate: string | null;
    isPrimary: boolean;
  }>;
  education: Array<{
    id: string;
    degree: string;
    major: string | null;
    school: string;
    graduationYear: number | null;
    notes: string | null;
  }>;
  languages: Array<{
    id: string;
    language: string;
    proficiency: LanguageProficiency;
  }>;
  passports: Array<{
    id: string;
    passportNumber: string;
    country: string;
    issueDate: string | null;
    expiryDate: string | null;
  }>;
  insurance: Array<{
    id: string;
    insuranceProvider: string;
    policyNumber: string;
    effectiveDate: string | null;
  }>;
};

export type ProfileMeta = {
  canEdit: boolean;
  canEditAllFields: boolean;
};

export type ProfileResponse = {
  data: EmployeeProfile;
  meta: ProfileMeta;
};

export type ProfileSectionId =
  | "basic"
  | "contact"
  | "worker"
  | "team"
  | "education"
  | "languages"
  | "passport"
  | "insurance";

export type UpdateProfilePayload = Partial<{
  basic: Partial<EmployeeProfile["basic"]>;
  contact: Partial<EmployeeProfile["contact"]>;
  worker: Partial<EmployeeProfile["worker"]>;
  teamAssignments: Omit<EmployeeProfile["teamAssignments"][number], "id">[];
  education: Omit<EmployeeProfile["education"][number], "id">[];
  languages: Omit<EmployeeProfile["languages"][number], "id">[];
  passports: Omit<EmployeeProfile["passports"][number], "id">[];
  insurance: Omit<EmployeeProfile["insurance"][number], "id">[];
}>;
