import {
  EmploymentStatus,
  FamilyRelationship,
  Gender,
  MaritalStatus,
  RoleCode,
  UpdateRequestStatus,
  UpdateRequestType,
} from '@prisma/client';

export const DEMO_PASSWORD = 'Password123!';

export const CITY_SEEDS = [
  { code: 'JKT', name: 'Jakarta', countryCode: 'ID' },
  { code: 'CNX', name: 'Chiang Mai', countryCode: 'TH' },
  { code: 'BKK', name: 'Bangkok', countryCode: 'TH' },
  { code: 'SIN', name: 'Singapore', countryCode: 'SG' },
] as const;

export const DEPARTMENTS = [
  'Engineering',
  'Human Resources',
  'Finance',
  'Operations',
  'Sales',
  'Marketing',
  'Legal',
  'IT Support',
] as const;

export type UserSeed = {
  email: string;
  role: RoleCode;
  cityCodes?: string[];
};

export const USER_SEEDS: UserSeed[] = [
  { email: 'admin@hris.local', role: RoleCode.ADMIN },
  { email: 'hr1@hris.local', role: RoleCode.HR, cityCodes: ['JKT'] },
  { email: 'hr2@hris.local', role: RoleCode.HR, cityCodes: ['BKK'] },
  { email: 'hr3@hris.local', role: RoleCode.HR, cityCodes: ['SIN', 'CNX'] },
  ...Array.from({ length: 10 }, (_, i) => ({
    email: `staff${i + 1}@hris.local`,
    role: RoleCode.STAFF,
  })),
];

export type EmployeeSeed = {
  employeeNo: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  phone: string;
  cityCode: string;
  department: (typeof DEPARTMENTS)[number];
  jobTitle: string;
  gender: Gender;
  maritalStatus: MaritalStatus;
  employmentStatus: EmploymentStatus;
  hireDate: string;
  loginEmail?: string;
  managerEmployeeNo?: string;
};

const staffProfiles: Omit<
  EmployeeSeed,
  'employeeNo' | 'cityCode' | 'loginEmail' | 'managerEmployeeNo'
>[] = [
  {
    firstName: 'Ayu',
    lastName: 'Wijaya',
    workEmail: 'ayu.wijaya@hris.local',
    phone: '+62 812 9001 1001',
    department: 'Engineering',
    jobTitle: 'Software Engineer',
    gender: Gender.FEMALE,
    maritalStatus: MaritalStatus.SINGLE,
    employmentStatus: EmploymentStatus.ACTIVE,
    hireDate: '2022-03-15',
  },
  {
    firstName: 'Budi',
    lastName: 'Santoso',
    workEmail: 'budi.santoso@hris.local',
    phone: '+62 813 9001 1002',
    department: 'Finance',
    jobTitle: 'Financial Analyst',
    gender: Gender.MALE,
    maritalStatus: MaritalStatus.MARRIED,
    employmentStatus: EmploymentStatus.ACTIVE,
    hireDate: '2021-08-01',
  },
  {
    firstName: 'Chompoo',
    lastName: 'Srisai',
    workEmail: 'chompoo.srisai@hris.local',
    phone: '+66 81 900 1103',
    department: 'Operations',
    jobTitle: 'Operations Coordinator',
    gender: Gender.FEMALE,
    maritalStatus: MaritalStatus.MARRIED,
    employmentStatus: EmploymentStatus.ACTIVE,
    hireDate: '2020-11-20',
  },
  {
    firstName: 'David',
    lastName: 'Tan',
    workEmail: 'david.tan@hris.local',
    phone: '+65 9123 4104',
    department: 'Sales',
    jobTitle: 'Account Executive',
    gender: Gender.MALE,
    maritalStatus: MaritalStatus.SINGLE,
    employmentStatus: EmploymentStatus.ACTIVE,
    hireDate: '2023-01-10',
  },
  {
    firstName: 'Elena',
    lastName: 'Kusuma',
    workEmail: 'elena.kusuma@hris.local',
    phone: '+62 821 9001 1005',
    department: 'Marketing',
    jobTitle: 'Marketing Specialist',
    gender: Gender.FEMALE,
    maritalStatus: MaritalStatus.DOMESTIC_PARTNERSHIP,
    employmentStatus: EmploymentStatus.ACTIVE,
    hireDate: '2022-07-05',
  },
  {
    firstName: 'Farhan',
    lastName: 'Rahman',
    workEmail: 'farhan.rahman@hris.local',
    phone: '+62 822 9001 1006',
    department: 'Engineering',
    jobTitle: 'QA Engineer',
    gender: Gender.MALE,
    maritalStatus: MaritalStatus.SINGLE,
    employmentStatus: EmploymentStatus.INACTIVE,
    hireDate: '2019-04-12',
  },
  {
    firstName: 'Grace',
    lastName: 'Lim',
    workEmail: 'grace.lim@hris.local',
    phone: '+65 9234 5107',
    department: 'Legal',
    jobTitle: 'Legal Counsel',
    gender: Gender.FEMALE,
    maritalStatus: MaritalStatus.MARRIED,
    employmentStatus: EmploymentStatus.ACTIVE,
    hireDate: '2018-09-30',
  },
  {
    firstName: 'Hendra',
    lastName: 'Pratama',
    workEmail: 'hendra.pratama@hris.local',
    phone: '+62 878 9001 1008',
    department: 'IT Support',
    jobTitle: 'IT Support Lead',
    gender: Gender.MALE,
    maritalStatus: MaritalStatus.DIVORCED,
    employmentStatus: EmploymentStatus.ACTIVE,
    hireDate: '2017-02-14',
  },
  {
    firstName: 'Irene',
    lastName: 'Wong',
    workEmail: 'irene.wong@hris.local',
    phone: '+66 92 900 1109',
    department: 'Human Resources',
    jobTitle: 'HR Generalist',
    gender: Gender.FEMALE,
    maritalStatus: MaritalStatus.SINGLE,
    employmentStatus: EmploymentStatus.ACTIVE,
    hireDate: '2021-05-18',
  },
  {
    firstName: 'Joko',
    lastName: 'Nugroho',
    workEmail: 'joko.nugroho@hris.local',
    phone: '+62 856 9001 1010',
    department: 'Operations',
    jobTitle: 'Warehouse Supervisor',
    gender: Gender.MALE,
    maritalStatus: MaritalStatus.MARRIED,
    employmentStatus: EmploymentStatus.TERMINATED,
    hireDate: '2016-06-01',
  },
];

const cityRotation = ['JKT', 'JKT', 'CNX', 'SIN', 'JKT', 'BKK', 'SIN', 'JKT', 'CNX', 'BKK'] as const;

export const LOGIN_EMPLOYEES: EmployeeSeed[] = staffProfiles.map((profile, index) => ({
  ...profile,
  employeeNo: `EMP-${String(index + 1).padStart(4, '0')}`,
  cityCode: cityRotation[index],
  loginEmail: `staff${index + 1}@hris.local`,
  managerEmployeeNo: index > 2 ? 'EMP-0003' : undefined,
}));

export const HR_EMPLOYEES: EmployeeSeed[] = [
  {
    employeeNo: 'EMP-HR-001',
    firstName: 'Kartika',
    lastName: 'Mahendra',
    workEmail: 'hr1@hris.local',
    phone: '+62 811 8000 2001',
    cityCode: 'JKT',
    department: 'Human Resources',
    jobTitle: 'HR Business Partner',
    gender: Gender.FEMALE,
    maritalStatus: MaritalStatus.MARRIED,
    employmentStatus: EmploymentStatus.ACTIVE,
    hireDate: '2019-01-08',
    loginEmail: 'hr1@hris.local',
  },
  {
    employeeNo: 'EMP-HR-002',
    firstName: 'Somchai',
    lastName: 'Pongpanich',
    workEmail: 'hr2@hris.local',
    phone: '+66 89 800 2202',
    cityCode: 'BKK',
    department: 'Human Resources',
    jobTitle: 'HR Manager',
    gender: Gender.MALE,
    maritalStatus: MaritalStatus.MARRIED,
    employmentStatus: EmploymentStatus.ACTIVE,
    hireDate: '2018-03-22',
    loginEmail: 'hr2@hris.local',
  },
  {
    employeeNo: 'EMP-HR-003',
    firstName: 'Mei',
    lastName: 'Cheong',
    workEmail: 'hr3@hris.local',
    phone: '+65 9188 3303',
    cityCode: 'SIN',
    department: 'Human Resources',
    jobTitle: 'Regional HR Lead',
    gender: Gender.FEMALE,
    maritalStatus: MaritalStatus.SINGLE,
    employmentStatus: EmploymentStatus.ACTIVE,
    hireDate: '2017-10-05',
    loginEmail: 'hr3@hris.local',
  },
];

const extraNames: Array<{
  firstName: string;
  lastName: string;
  gender: Gender;
  maritalStatus: MaritalStatus;
}> = [
  { firstName: 'Liam', lastName: 'Nguyen', gender: Gender.MALE, maritalStatus: MaritalStatus.SINGLE },
  { firstName: 'Maya', lastName: 'Putri', gender: Gender.FEMALE, maritalStatus: MaritalStatus.MARRIED },
  { firstName: 'Noah', lastName: 'Chen', gender: Gender.MALE, maritalStatus: MaritalStatus.MARRIED },
  { firstName: 'Olivia', lastName: 'Siregar', gender: Gender.FEMALE, maritalStatus: MaritalStatus.SINGLE },
  { firstName: 'Pim', lastName: 'Thongchai', gender: Gender.NON_BINARY, maritalStatus: MaritalStatus.SINGLE },
  { firstName: 'Quinn', lastName: 'Hartono', gender: Gender.PREFER_NOT_TO_SAY, maritalStatus: MaritalStatus.DOMESTIC_PARTNERSHIP },
  { firstName: 'Rina', lastName: 'Susanto', gender: Gender.FEMALE, maritalStatus: MaritalStatus.DIVORCED },
  { firstName: 'Samuel', lastName: 'Lee', gender: Gender.MALE, maritalStatus: MaritalStatus.MARRIED },
  { firstName: 'Tara', lastName: 'Boonma', gender: Gender.FEMALE, maritalStatus: MaritalStatus.SINGLE },
  { firstName: 'Umar', lastName: 'Hakim', gender: Gender.MALE, maritalStatus: MaritalStatus.MARRIED },
  { firstName: 'Vina', lastName: 'Koh', gender: Gender.FEMALE, maritalStatus: MaritalStatus.MARRIED },
  { firstName: 'William', lastName: 'Setiawan', gender: Gender.MALE, maritalStatus: MaritalStatus.SINGLE },
  { firstName: 'Xena', lastName: 'Arifin', gender: Gender.FEMALE, maritalStatus: MaritalStatus.SINGLE },
  { firstName: 'Yudi', lastName: 'Pham', gender: Gender.MALE, maritalStatus: MaritalStatus.MARRIED },
  { firstName: 'Zara', lastName: 'Lestari', gender: Gender.FEMALE, maritalStatus: MaritalStatus.WIDOWED },
  { firstName: 'Arif', lastName: 'Gunawan', gender: Gender.MALE, maritalStatus: MaritalStatus.MARRIED },
  { firstName: 'Bella', lastName: 'Chua', gender: Gender.FEMALE, maritalStatus: MaritalStatus.SINGLE },
  { firstName: 'Carlos', lastName: 'Menon', gender: Gender.MALE, maritalStatus: MaritalStatus.DIVORCED },
  { firstName: 'Dewi', lastName: 'Ananda', gender: Gender.FEMALE, maritalStatus: MaritalStatus.MARRIED },
  { firstName: 'Ethan', lastName: 'Sukarno', gender: Gender.MALE, maritalStatus: MaritalStatus.SINGLE },
  { firstName: 'Fitri', lastName: 'Nash', gender: Gender.FEMALE, maritalStatus: MaritalStatus.MARRIED },
  { firstName: 'Gavin', lastName: 'Teo', gender: Gender.MALE, maritalStatus: MaritalStatus.SINGLE },
  { firstName: 'Hana', lastName: 'Wibowo', gender: Gender.FEMALE, maritalStatus: MaritalStatus.SINGLE },
  { firstName: 'Ian', lastName: 'Rajagopal', gender: Gender.MALE, maritalStatus: MaritalStatus.MARRIED },
  { firstName: 'Julia', lastName: 'Saetang', gender: Gender.FEMALE, maritalStatus: MaritalStatus.DOMESTIC_PARTNERSHIP },
  { firstName: 'Kevin', lastName: 'Halim', gender: Gender.MALE, maritalStatus: MaritalStatus.SINGLE },
  { firstName: 'Lina', lastName: 'Ong', gender: Gender.FEMALE, maritalStatus: MaritalStatus.MARRIED },
  { firstName: 'Marco', lastName: 'Utami', gender: Gender.MALE, maritalStatus: MaritalStatus.MARRIED },
  { firstName: 'Nadia', lastName: 'Yeo', gender: Gender.FEMALE, maritalStatus: MaritalStatus.SINGLE },
  { firstName: 'Oscar', lastName: 'Pattana', gender: Gender.MALE, maritalStatus: MaritalStatus.SINGLE },
  { firstName: 'Putri', lastName: 'Fadillah', gender: Gender.FEMALE, maritalStatus: MaritalStatus.MARRIED },
  { firstName: 'Ravi', lastName: 'Sim', gender: Gender.MALE, maritalStatus: MaritalStatus.SINGLE },
  { firstName: 'Siti', lastName: 'Mahmud', gender: Gender.FEMALE, maritalStatus: MaritalStatus.WIDOWED },
  { firstName: 'Thomas', lastName: 'Kurnia', gender: Gender.MALE, maritalStatus: MaritalStatus.MARRIED },
  { firstName: 'Ulya', lastName: 'Boonyarat', gender: Gender.FEMALE, maritalStatus: MaritalStatus.SINGLE },
  { firstName: 'Victor', lastName: 'Hermawan', gender: Gender.MALE, maritalStatus: MaritalStatus.TERMINATED },
  { firstName: 'Wulan', lastName: 'Chandrakumar', gender: Gender.FEMALE, maritalStatus: MaritalStatus.MARRIED },
  { firstName: 'Xavier', lastName: 'Prasetyo', gender: Gender.MALE, maritalStatus: MaritalStatus.SINGLE },
  { firstName: 'Yasmin', lastName: 'Tang', gender: Gender.FEMALE, maritalStatus: MaritalStatus.MARRIED },
  { firstName: 'Zain', lastName: 'Ratana', gender: Gender.MALE, maritalStatus: MaritalStatus.SINGLE },
];

const extraCityCodes = [
  'JKT', 'JKT', 'JKT', 'JKT', 'JKT', 'JKT', 'JKT', 'JKT',
  'BKK', 'BKK', 'BKK', 'BKK', 'BKK', 'BKK', 'BKK', 'BKK',
  'SIN', 'SIN', 'SIN', 'SIN', 'SIN', 'SIN', 'SIN', 'SIN',
  'CNX', 'CNX', 'CNX', 'CNX', 'CNX', 'CNX', 'CNX', 'CNX',
  'JKT', 'BKK', 'SIN', 'CNX', 'JKT', 'BKK',
] as const;

const statusCycle: EmploymentStatus[] = [
  EmploymentStatus.ACTIVE,
  EmploymentStatus.ACTIVE,
  EmploymentStatus.ACTIVE,
  EmploymentStatus.ACTIVE,
  EmploymentStatus.INACTIVE,
  EmploymentStatus.ACTIVE,
  EmploymentStatus.TERMINATED,
  EmploymentStatus.ACTIVE,
];

export const BULK_EMPLOYEES: EmployeeSeed[] = extraNames.map((person, index) => {
  const dept = DEPARTMENTS[index % DEPARTMENTS.length];
  const num = index + 11;
  const slug = `${person.firstName}.${person.lastName}`.toLowerCase().replace(/\s+/g, '');

  return {
    employeeNo: `EMP-${String(num).padStart(4, '0')}`,
    firstName: person.firstName,
    lastName: person.lastName,
    workEmail: `${slug}@hris.local`,
    phone: `+62 8${String(1000 + num).slice(-3)} ${9000 + num}`,
    cityCode: extraCityCodes[index % extraCityCodes.length],
    department: dept,
    jobTitle: `${dept} Associate`,
    gender: person.gender,
    maritalStatus: person.maritalStatus,
    employmentStatus: statusCycle[index % statusCycle.length],
    hireDate: `20${15 + (index % 9)}-${String((index % 12) + 1).padStart(2, '0')}-01`,
    managerEmployeeNo: index % 4 === 0 ? 'EMP-0008' : undefined,
  };
});

export const ALL_EMPLOYEES: EmployeeSeed[] = [
  ...LOGIN_EMPLOYEES,
  ...HR_EMPLOYEES,
  ...BULK_EMPLOYEES,
];

export type FamilyMemberSeed = {
  relationshipType: FamilyRelationship;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  /** Links member to an employee record (required for WORKER). */
  employeeNo?: string;
};

export type FamilySeed = {
  rcNumber: string;
  displayName: string;
  workerEmployeeNo: string;
  dependents: FamilyMemberSeed[];
};

/** Ten demo families aligned with official HRIS family / RC account model. */
export const FAMILY_SEEDS: FamilySeed[] = [
  {
    rcNumber: 'RC-2024-0001',
    displayName: 'Wijaya Family',
    workerEmployeeNo: 'EMP-0001',
    dependents: [
      { relationshipType: FamilyRelationship.PARENT, firstName: 'Sri', lastName: 'Wijaya', dateOfBirth: '1965-04-12' },
      { relationshipType: FamilyRelationship.PARENT, firstName: 'Bambang', lastName: 'Wijaya', dateOfBirth: '1963-08-30' },
    ],
  },
  {
    rcNumber: 'RC-2024-0002',
    displayName: 'Santoso Family',
    workerEmployeeNo: 'EMP-0002',
    dependents: [
      { relationshipType: FamilyRelationship.SPOUSE, firstName: 'Dewi', lastName: 'Santoso', dateOfBirth: '1990-06-18' },
      { relationshipType: FamilyRelationship.SON, firstName: 'Raka', lastName: 'Santoso', dateOfBirth: '2015-02-03' },
      { relationshipType: FamilyRelationship.DAUGHTER, firstName: 'Mira', lastName: 'Santoso', dateOfBirth: '2018-11-22' },
    ],
  },
  {
    rcNumber: 'RC-2024-0003',
    displayName: 'Srisai Family',
    workerEmployeeNo: 'EMP-0003',
    dependents: [
      { relationshipType: FamilyRelationship.SPOUSE, firstName: 'Somkid', lastName: 'Srisai', dateOfBirth: '1988-09-05' },
      { relationshipType: FamilyRelationship.SON, firstName: 'Natt', lastName: 'Srisai', dateOfBirth: '2012-07-14' },
    ],
  },
  {
    rcNumber: 'RC-2024-0004',
    displayName: 'Tan Family',
    workerEmployeeNo: 'EMP-0004',
    dependents: [
      { relationshipType: FamilyRelationship.PARENT, firstName: 'Mei Ling', lastName: 'Tan', dateOfBirth: '1968-01-20' },
    ],
  },
  {
    rcNumber: 'RC-2024-0005',
    displayName: 'Kusuma Family',
    workerEmployeeNo: 'EMP-0005',
    dependents: [
      { relationshipType: FamilyRelationship.SPOUSE, firstName: 'Alex', lastName: 'Rivera', dateOfBirth: '1992-03-28' },
      { relationshipType: FamilyRelationship.PARENT, firstName: 'Ratna', lastName: 'Kusuma', dateOfBirth: '1960-12-01' },
    ],
  },
  {
    rcNumber: 'RC-2024-0006',
    displayName: 'Rahman Family',
    workerEmployeeNo: 'EMP-0006',
    dependents: [
      { relationshipType: FamilyRelationship.PARENT, firstName: 'Halim', lastName: 'Rahman', dateOfBirth: '1958-05-17' },
      { relationshipType: FamilyRelationship.PARENT, firstName: 'Siti', lastName: 'Rahman', dateOfBirth: '1961-10-09' },
    ],
  },
  {
    rcNumber: 'RC-2024-0007',
    displayName: 'Lim Family',
    workerEmployeeNo: 'EMP-0007',
    dependents: [
      { relationshipType: FamilyRelationship.SPOUSE, firstName: 'Daniel', lastName: 'Lim', dateOfBirth: '1985-07-11' },
      { relationshipType: FamilyRelationship.DAUGHTER, firstName: 'Sophie', lastName: 'Lim', dateOfBirth: '2016-04-08' },
      { relationshipType: FamilyRelationship.SON, firstName: 'Ethan', lastName: 'Lim', dateOfBirth: '2019-09-19' },
    ],
  },
  {
    rcNumber: 'RC-2024-0008',
    displayName: 'Pratama Family',
    workerEmployeeNo: 'EMP-0008',
    dependents: [
      { relationshipType: FamilyRelationship.SON, firstName: 'Bagas', lastName: 'Pratama', dateOfBirth: '2010-03-25' },
      { relationshipType: FamilyRelationship.DAUGHTER, firstName: 'Citra', lastName: 'Pratama', dateOfBirth: '2013-12-30' },
      { relationshipType: FamilyRelationship.PARENT, firstName: 'Surya', lastName: 'Pratama', dateOfBirth: '1955-06-06' },
    ],
  },
  {
    rcNumber: 'RC-2024-0009',
    displayName: 'Wong Family',
    workerEmployeeNo: 'EMP-0009',
    dependents: [
      { relationshipType: FamilyRelationship.PARENT, firstName: 'Chai', lastName: 'Wong', dateOfBirth: '1964-02-14' },
      { relationshipType: FamilyRelationship.PARENT, firstName: 'Nok', lastName: 'Wong', dateOfBirth: '1966-08-21' },
    ],
  },
  {
    rcNumber: 'RC-2024-0010',
    displayName: 'Nugroho Family',
    workerEmployeeNo: 'EMP-0010',
    dependents: [
      { relationshipType: FamilyRelationship.SPOUSE, firstName: 'Anisa', lastName: 'Nugroho', dateOfBirth: '1987-11-03' },
      { relationshipType: FamilyRelationship.SON, firstName: 'Dimas', lastName: 'Nugroho', dateOfBirth: '2011-05-16' },
    ],
  },
];

export type ApprovalScenario = {
  requestNo: string;
  status: UpdateRequestStatus;
  requestType: UpdateRequestType;
  scenario: 'phone' | 'passport' | 'address' | 'workEmail';
  targetEmployeeNo: string;
  requesterEmployeeNo: string;
  approverEmail: string;
  rejectionReason?: string;
  submittedDaysAgo: number;
  resolvedDaysAgo?: number;
};

export const APPROVAL_SCENARIOS: ApprovalScenario[] = [
  {
    requestNo: 'REQ-2025-00001',
    status: UpdateRequestStatus.PENDING,
    requestType: UpdateRequestType.PROFILE_UPDATE,
    scenario: 'phone',
    targetEmployeeNo: 'EMP-0001',
    requesterEmployeeNo: 'EMP-0001',
    approverEmail: 'hr1@hris.local',
    submittedDaysAgo: 1,
  },
  {
    requestNo: 'REQ-2025-00002',
    status: UpdateRequestStatus.PENDING,
    requestType: UpdateRequestType.PROFILE_UPDATE,
    scenario: 'address',
    targetEmployeeNo: 'EMP-0002',
    requesterEmployeeNo: 'EMP-0002',
    approverEmail: 'hr1@hris.local',
    submittedDaysAgo: 2,
  },
  {
    requestNo: 'REQ-2025-00003',
    status: UpdateRequestStatus.PENDING,
    requestType: UpdateRequestType.SENSITIVE_FIELD_UPDATE,
    scenario: 'passport',
    targetEmployeeNo: 'EMP-0004',
    requesterEmployeeNo: 'EMP-0004',
    approverEmail: 'hr3@hris.local',
    submittedDaysAgo: 0,
  },
  {
    requestNo: 'REQ-2025-00004',
    status: UpdateRequestStatus.PENDING,
    requestType: UpdateRequestType.PROFILE_UPDATE,
    scenario: 'phone',
    targetEmployeeNo: 'EMP-0015',
    requesterEmployeeNo: 'EMP-0015',
    approverEmail: 'hr1@hris.local',
    submittedDaysAgo: 3,
  },
  {
    requestNo: 'REQ-2025-00005',
    status: UpdateRequestStatus.PENDING,
    requestType: UpdateRequestType.PROFILE_UPDATE,
    scenario: 'address',
    targetEmployeeNo: 'EMP-0020',
    requesterEmployeeNo: 'EMP-0020',
    approverEmail: 'hr2@hris.local',
    submittedDaysAgo: 1,
  },
  {
    requestNo: 'REQ-2025-00006',
    status: UpdateRequestStatus.PENDING,
    requestType: UpdateRequestType.SENSITIVE_FIELD_UPDATE,
    scenario: 'workEmail',
    targetEmployeeNo: 'EMP-0005',
    requesterEmployeeNo: 'EMP-0005',
    approverEmail: 'hr1@hris.local',
    submittedDaysAgo: 4,
  },
  {
    requestNo: 'REQ-2025-00007',
    status: UpdateRequestStatus.PENDING,
    requestType: UpdateRequestType.PROFILE_UPDATE,
    scenario: 'passport',
    targetEmployeeNo: 'EMP-0030',
    requesterEmployeeNo: 'EMP-0030',
    approverEmail: 'hr3@hris.local',
    submittedDaysAgo: 2,
  },
  {
    requestNo: 'REQ-2025-00008',
    status: UpdateRequestStatus.PENDING,
    requestType: UpdateRequestType.PROFILE_UPDATE,
    scenario: 'phone',
    targetEmployeeNo: 'EMP-0035',
    requesterEmployeeNo: 'EMP-0035',
    approverEmail: 'hr2@hris.local',
    submittedDaysAgo: 0,
  },
  {
    requestNo: 'REQ-2025-00009',
    status: UpdateRequestStatus.PENDING,
    requestType: UpdateRequestType.PROFILE_UPDATE,
    scenario: 'address',
    targetEmployeeNo: 'EMP-0040',
    requesterEmployeeNo: 'EMP-0040',
    approverEmail: 'hr3@hris.local',
    submittedDaysAgo: 5,
  },
  {
    requestNo: 'REQ-2025-00010',
    status: UpdateRequestStatus.PENDING,
    requestType: UpdateRequestType.PROFILE_UPDATE,
    scenario: 'phone',
    targetEmployeeNo: 'EMP-0012',
    requesterEmployeeNo: 'EMP-0012',
    approverEmail: 'hr1@hris.local',
    submittedDaysAgo: 1,
  },
  {
    requestNo: 'REQ-2025-00011',
    status: UpdateRequestStatus.PENDING,
    requestType: UpdateRequestType.SENSITIVE_FIELD_UPDATE,
    scenario: 'workEmail',
    targetEmployeeNo: 'EMP-0025',
    requesterEmployeeNo: 'EMP-0025',
    approverEmail: 'hr2@hris.local',
    submittedDaysAgo: 2,
  },
  {
    requestNo: 'REQ-2025-00012',
    status: UpdateRequestStatus.PENDING,
    requestType: UpdateRequestType.PROFILE_UPDATE,
    scenario: 'passport',
    targetEmployeeNo: 'EMP-0018',
    requesterEmployeeNo: 'EMP-0018',
    approverEmail: 'hr1@hris.local',
    submittedDaysAgo: 3,
  },
  {
    requestNo: 'REQ-2024-00101',
    status: UpdateRequestStatus.APPROVED,
    requestType: UpdateRequestType.PROFILE_UPDATE,
    scenario: 'phone',
    targetEmployeeNo: 'EMP-0003',
    requesterEmployeeNo: 'EMP-0003',
    approverEmail: 'hr3@hris.local',
    submittedDaysAgo: 14,
    resolvedDaysAgo: 12,
  },
  {
    requestNo: 'REQ-2024-00102',
    status: UpdateRequestStatus.APPROVED,
    requestType: UpdateRequestType.PROFILE_UPDATE,
    scenario: 'address',
    targetEmployeeNo: 'EMP-0006',
    requesterEmployeeNo: 'EMP-0006',
    approverEmail: 'hr1@hris.local',
    submittedDaysAgo: 20,
    resolvedDaysAgo: 18,
  },
  {
    requestNo: 'REQ-2024-00103',
    status: UpdateRequestStatus.APPROVED,
    requestType: UpdateRequestType.SENSITIVE_FIELD_UPDATE,
    scenario: 'workEmail',
    targetEmployeeNo: 'EMP-0011',
    requesterEmployeeNo: 'EMP-0011',
    approverEmail: 'hr1@hris.local',
    submittedDaysAgo: 25,
    resolvedDaysAgo: 23,
  },
  {
    requestNo: 'REQ-2024-00104',
    status: UpdateRequestStatus.APPROVED,
    requestType: UpdateRequestType.PROFILE_UPDATE,
    scenario: 'passport',
    targetEmployeeNo: 'EMP-0022',
    requesterEmployeeNo: 'EMP-0022',
    approverEmail: 'hr2@hris.local',
    submittedDaysAgo: 30,
    resolvedDaysAgo: 28,
  },
  {
    requestNo: 'REQ-2024-00105',
    status: UpdateRequestStatus.APPROVED,
    requestType: UpdateRequestType.PROFILE_UPDATE,
    scenario: 'phone',
    targetEmployeeNo: 'EMP-0028',
    requesterEmployeeNo: 'EMP-0028',
    approverEmail: 'hr2@hris.local',
    submittedDaysAgo: 10,
    resolvedDaysAgo: 9,
  },
  {
    requestNo: 'REQ-2024-00106',
    status: UpdateRequestStatus.APPROVED,
    requestType: UpdateRequestType.PROFILE_UPDATE,
    scenario: 'address',
    targetEmployeeNo: 'EMP-0033',
    requesterEmployeeNo: 'EMP-0033',
    approverEmail: 'hr3@hris.local',
    submittedDaysAgo: 16,
    resolvedDaysAgo: 15,
  },
  {
    requestNo: 'REQ-2024-00107',
    status: UpdateRequestStatus.APPROVED,
    requestType: UpdateRequestType.SENSITIVE_FIELD_UPDATE,
    scenario: 'workEmail',
    targetEmployeeNo: 'EMP-0016',
    requesterEmployeeNo: 'EMP-0016',
    approverEmail: 'hr1@hris.local',
    submittedDaysAgo: 8,
    resolvedDaysAgo: 7,
  },
  {
    requestNo: 'REQ-2024-00108',
    status: UpdateRequestStatus.APPROVED,
    requestType: UpdateRequestType.PROFILE_UPDATE,
    scenario: 'phone',
    targetEmployeeNo: 'EMP-0042',
    requesterEmployeeNo: 'EMP-0042',
    approverEmail: 'hr3@hris.local',
    submittedDaysAgo: 22,
    resolvedDaysAgo: 21,
  },
  {
    requestNo: 'REQ-2024-00109',
    status: UpdateRequestStatus.APPROVED,
    requestType: UpdateRequestType.PROFILE_UPDATE,
    scenario: 'passport',
    targetEmployeeNo: 'EMP-0007',
    requesterEmployeeNo: 'EMP-0007',
    approverEmail: 'hr3@hris.local',
    submittedDaysAgo: 12,
    resolvedDaysAgo: 11,
  },
  {
    requestNo: 'REQ-2024-00110',
    status: UpdateRequestStatus.APPROVED,
    requestType: UpdateRequestType.PROFILE_UPDATE,
    scenario: 'address',
    targetEmployeeNo: 'EMP-0038',
    requesterEmployeeNo: 'EMP-0038',
    approverEmail: 'hr2@hris.local',
    submittedDaysAgo: 18,
    resolvedDaysAgo: 17,
  },
  {
    requestNo: 'REQ-2024-00201',
    status: UpdateRequestStatus.REJECTED,
    requestType: UpdateRequestType.SENSITIVE_FIELD_UPDATE,
    scenario: 'workEmail',
    targetEmployeeNo: 'EMP-0009',
    requesterEmployeeNo: 'EMP-0009',
    approverEmail: 'hr3@hris.local',
    rejectionReason: 'Work email domain must remain @hris.local for SSO.',
    submittedDaysAgo: 9,
    resolvedDaysAgo: 8,
  },
  {
    requestNo: 'REQ-2024-00202',
    status: UpdateRequestStatus.REJECTED,
    requestType: UpdateRequestType.PROFILE_UPDATE,
    scenario: 'passport',
    targetEmployeeNo: 'EMP-0014',
    requesterEmployeeNo: 'EMP-0014',
    approverEmail: 'hr1@hris.local',
    rejectionReason: 'Passport copy expired; please upload a valid document.',
    submittedDaysAgo: 15,
    resolvedDaysAgo: 14,
  },
  {
    requestNo: 'REQ-2024-00203',
    status: UpdateRequestStatus.REJECTED,
    requestType: UpdateRequestType.PROFILE_UPDATE,
    scenario: 'address',
    targetEmployeeNo: 'EMP-0019',
    requesterEmployeeNo: 'EMP-0019',
    approverEmail: 'hr2@hris.local',
    rejectionReason: 'Address proof did not match government ID.',
    submittedDaysAgo: 11,
    resolvedDaysAgo: 10,
  },
  {
    requestNo: 'REQ-2024-00204',
    status: UpdateRequestStatus.REJECTED,
    requestType: UpdateRequestType.PROFILE_UPDATE,
    scenario: 'phone',
    targetEmployeeNo: 'EMP-0024',
    requesterEmployeeNo: 'EMP-0024',
    approverEmail: 'hr2@hris.local',
    rejectionReason: 'Phone number format invalid for Thailand region.',
    submittedDaysAgo: 7,
    resolvedDaysAgo: 6,
  },
  {
    requestNo: 'REQ-2024-00205',
    status: UpdateRequestStatus.REJECTED,
    requestType: UpdateRequestType.SENSITIVE_FIELD_UPDATE,
    scenario: 'workEmail',
    targetEmployeeNo: 'EMP-0031',
    requesterEmployeeNo: 'EMP-0031',
    approverEmail: 'hr3@hris.local',
    rejectionReason: 'Requested email already assigned to another employee.',
    submittedDaysAgo: 13,
    resolvedDaysAgo: 12,
  },
  {
    requestNo: 'REQ-2024-00206',
    status: UpdateRequestStatus.REJECTED,
    requestType: UpdateRequestType.PROFILE_UPDATE,
    scenario: 'passport',
    targetEmployeeNo: 'EMP-0045',
    requesterEmployeeNo: 'EMP-0045',
    approverEmail: 'hr1@hris.local',
    rejectionReason: 'Incomplete passport metadata in request payload.',
    submittedDaysAgo: 6,
    resolvedDaysAgo: 5,
  },
  {
    requestNo: 'REQ-2024-00301',
    status: UpdateRequestStatus.CANCELLED,
    requestType: UpdateRequestType.PROFILE_UPDATE,
    scenario: 'phone',
    targetEmployeeNo: 'EMP-0008',
    requesterEmployeeNo: 'EMP-0008',
    approverEmail: 'hr1@hris.local',
    submittedDaysAgo: 5,
    resolvedDaysAgo: 4,
  },
  {
    requestNo: 'REQ-2024-00302',
    status: UpdateRequestStatus.CANCELLED,
    requestType: UpdateRequestType.PROFILE_UPDATE,
    scenario: 'address',
    targetEmployeeNo: 'EMP-0027',
    requesterEmployeeNo: 'EMP-0027',
    approverEmail: 'hr2@hris.local',
    submittedDaysAgo: 4,
    resolvedDaysAgo: 3,
  },
];
