import {
  LanguageProficiency,
  WorkerStatus,
  WorkerType,
} from '@prisma/client';

export type ProfileSeed = {
  employeeNo: string;
  basic?: {
    preferredName?: string;
    dateOfBirth?: string;
    citizenship?: string;
    rcNumber?: string;
  };
  contact?: {
    primaryAddressLine1?: string;
    primaryCity?: string;
    primaryCountry?: string;
    phoneSecondary?: string;
    emailSecondary?: string;
    signalAccount?: string;
  };
  worker?: {
    workerType?: WorkerType;
    workerStatus?: WorkerStatus;
    ministryJoinDate?: string;
    workerJoinDate?: string;
    sendingRegion?: string;
    salarySource?: string;
  };
  teamAssignments?: Array<{
    team: string;
    position: string;
    startDate: string;
    endDate?: string;
    isPrimary?: boolean;
  }>;
  education?: Array<{
    degree: string;
    major?: string;
    school: string;
    graduationYear?: number;
  }>;
  languages?: Array<{ language: string; proficiency: LanguageProficiency }>;
  passports?: Array<{
    passportNumber: string;
    country: string;
    issueDate?: string;
    expiryDate?: string;
  }>;
  insurance?: Array<{
    insuranceProvider: string;
    policyNumber: string;
    effectiveDate?: string;
  }>;
};

export const PROFILE_SEEDS: ProfileSeed[] = [
  {
    employeeNo: 'EMP-0001',
    basic: {
      preferredName: 'Ayu',
      dateOfBirth: '1995-08-12',
      citizenship: 'Indonesia',
      rcNumber: 'RC-2024-0001',
    },
    contact: {
      primaryAddressLine1: 'Jl. Sudirman No. 45',
      primaryCity: 'Jakarta',
      primaryCountry: 'Indonesia',
      signalAccount: 'ayu.wijaya.95',
    },
    worker: {
      workerType: WorkerType.FULL_TIME,
      workerStatus: WorkerStatus.ACTIVE,
      ministryJoinDate: '2020-01-15',
      workerJoinDate: '2022-03-15',
      sendingRegion: 'Southeast Asia',
      salarySource: 'Regional HQ',
    },
    teamAssignments: [
      {
        team: 'Engineering',
        position: 'Software Engineer',
        startDate: '2022-03-15',
        isPrimary: true,
      },
    ],
    education: [
      {
        degree: 'B.Sc. Computer Science',
        school: 'Universitas Indonesia',
        graduationYear: 2017,
      },
    ],
    languages: [
      { language: 'Indonesian', proficiency: LanguageProficiency.NATIVE },
      { language: 'English', proficiency: LanguageProficiency.FLUENT },
    ],
    passports: [
      {
        passportNumber: 'A1234567',
        country: 'Indonesia',
        issueDate: '2019-06-01',
        expiryDate: '2029-06-01',
      },
    ],
    insurance: [
      {
        insuranceProvider: 'Allianz Regional',
        policyNumber: 'ALZ-ID-88421',
        effectiveDate: '2022-04-01',
      },
    ],
  },
  {
    employeeNo: 'EMP-0002',
    basic: {
      preferredName: 'Budi',
      dateOfBirth: '1988-03-22',
      citizenship: 'Indonesia',
      rcNumber: 'RC-2024-0002',
    },
    contact: {
      primaryAddressLine1: 'Jl. Thamrin 12',
      primaryCity: 'Jakarta',
      primaryCountry: 'Indonesia',
      signalAccount: 'budi.santoso',
    },
    worker: {
      workerType: WorkerType.FULL_TIME,
      workerStatus: WorkerStatus.ACTIVE,
      ministryJoinDate: '2015-06-01',
      workerJoinDate: '2021-08-01',
      sendingRegion: 'Southeast Asia',
      salarySource: 'Local Congregation',
    },
    teamAssignments: [
      {
        team: 'Finance',
        position: 'Financial Analyst',
        startDate: '2021-08-01',
        isPrimary: true,
      },
    ],
    education: [
      {
        degree: 'B.A. Economics',
        major: 'Finance',
        school: 'Universitas Gadjah Mada',
        graduationYear: 2010,
      },
    ],
    languages: [
      { language: 'Indonesian', proficiency: LanguageProficiency.NATIVE },
      { language: 'English', proficiency: LanguageProficiency.CONVERSATIONAL },
    ],
    passports: [
      {
        passportNumber: 'B9876543',
        country: 'Indonesia',
        expiryDate: '2030-12-31',
      },
    ],
    insurance: [
      {
        insuranceProvider: 'Prudential Indonesia',
        policyNumber: 'PRU-552901',
        effectiveDate: '2021-09-01',
      },
    ],
  },
  {
    employeeNo: 'EMP-0003',
    basic: {
      dateOfBirth: '1992-11-05',
      citizenship: 'Thailand',
      rcNumber: 'RC-2024-0003',
    },
    worker: {
      workerType: WorkerType.FULL_TIME,
      workerStatus: WorkerStatus.ACTIVE,
      workerJoinDate: '2020-11-20',
      sendingRegion: 'Thailand',
      salarySource: 'Regional HQ',
    },
    teamAssignments: [
      {
        team: 'Operations',
        position: 'Operations Coordinator',
        startDate: '2020-11-20',
        isPrimary: true,
      },
    ],
    languages: [
      { language: 'Thai', proficiency: LanguageProficiency.NATIVE },
      { language: 'English', proficiency: LanguageProficiency.FLUENT },
    ],
  },
  {
    employeeNo: 'EMP-HR-001',
    basic: {
      preferredName: 'Kartika',
      dateOfBirth: '1987-02-18',
      citizenship: 'Indonesia',
    },
    worker: {
      workerType: WorkerType.FULL_TIME,
      workerStatus: WorkerStatus.ACTIVE,
      ministryJoinDate: '2012-01-01',
      workerJoinDate: '2019-01-08',
      sendingRegion: 'Southeast Asia',
      salarySource: 'HQ Payroll',
    },
    teamAssignments: [
      {
        team: 'Human Resources',
        position: 'HR Business Partner',
        startDate: '2019-01-08',
        isPrimary: true,
      },
    ],
    education: [
      {
        degree: 'M.A. Human Resource Management',
        school: 'Universitas Indonesia',
        graduationYear: 2012,
      },
    ],
    languages: [
      { language: 'Indonesian', proficiency: LanguageProficiency.NATIVE },
      { language: 'English', proficiency: LanguageProficiency.FLUENT },
    ],
  },
];
