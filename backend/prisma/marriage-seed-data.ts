import { MarriageRequestStatus } from '@prisma/client';

export type MarriageRequestSeed = {
  requestNo: string;
  requesterEmployeeNo: string;
  spouseEmployeeNo: string;
  status: MarriageRequestStatus;
  rejectionReason?: string;
};

export const MARRIAGE_REQUEST_SEEDS: MarriageRequestSeed[] = [
  {
    requestNo: 'MR-00001',
    requesterEmployeeNo: 'EMP-0004',
    spouseEmployeeNo: 'EMP-0007',
    status: MarriageRequestStatus.PENDING,
  },
  {
    requestNo: 'MR-00002',
    requesterEmployeeNo: 'EMP-0001',
    spouseEmployeeNo: 'EMP-0005',
    status: MarriageRequestStatus.REJECTED,
    rejectionReason: 'RC account consolidation requires additional documentation.',
  },
];

export const MARRIAGE_APPROVED_SEEDS = [
  {
    requestNo: 'MR-00003',
    requesterEmployeeNo: 'EMP-0008',
    spouseEmployeeNo: 'EMP-0002',
  },
];
