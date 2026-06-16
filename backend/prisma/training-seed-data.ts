import { TrainingStatus } from '@prisma/client';

export type TrainingSeed = {
  code: string;
  title: string;
  category: string;
  provider: string;
  startDate: string;
  endDate: string;
};

export const TRAINING_SEEDS: TrainingSeed[] = [
  {
    code: 'TRN-001',
    title: 'Workplace Safety Fundamentals',
    category: 'Compliance',
    provider: 'SafeWork Academy',
    startDate: '2025-01-15',
    endDate: '2025-12-31',
  },
  {
    code: 'TRN-002',
    title: 'Anti-Harassment & Respect at Work',
    category: 'Compliance',
    provider: 'HR Compliance Institute',
    startDate: '2025-02-01',
    endDate: '2025-12-31',
  },
  {
    code: 'TRN-003',
    title: 'Data Privacy & GDPR Essentials',
    category: 'Compliance',
    provider: 'PrivacyFirst Learning',
    startDate: '2025-03-01',
    endDate: '2026-03-01',
  },
  {
    code: 'TRN-004',
    title: 'Leadership Essentials for New Managers',
    category: 'Leadership',
    provider: 'Management Lab',
    startDate: '2025-04-01',
    endDate: '2025-10-31',
  },
  {
    code: 'TRN-005',
    title: 'Effective 1:1 Conversations',
    category: 'Leadership',
    provider: 'Management Lab',
    startDate: '2025-05-01',
    endDate: '2025-11-30',
  },
  {
    code: 'TRN-006',
    title: 'Advanced Excel for HR Analytics',
    category: 'Technical',
    provider: 'SkillBridge',
    startDate: '2025-01-10',
    endDate: '2025-09-30',
  },
  {
    code: 'TRN-007',
    title: 'SQL Basics for People Teams',
    category: 'Technical',
    provider: 'SkillBridge',
    startDate: '2025-06-01',
    endDate: '2026-06-01',
  },
  {
    code: 'TRN-008',
    title: 'Customer Service Excellence',
    category: 'Soft Skills',
    provider: 'ServiceMind',
    startDate: '2025-02-15',
    endDate: '2025-08-15',
  },
  {
    code: 'TRN-009',
    title: 'Conflict Resolution in Teams',
    category: 'Soft Skills',
    provider: 'Collaborate Co.',
    startDate: '2025-03-15',
    endDate: '2025-12-15',
  },
  {
    code: 'TRN-010',
    title: 'Time Management & Prioritization',
    category: 'Soft Skills',
    provider: 'Productivity Plus',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
  },
  {
    code: 'TRN-011',
    title: 'First Aid & Emergency Response',
    category: 'Health & Safety',
    provider: 'MedReady Training',
    startDate: '2025-04-15',
    endDate: '2026-04-15',
  },
  {
    code: 'TRN-012',
    title: 'Fire Safety & Evacuation Procedures',
    category: 'Health & Safety',
    provider: 'MedReady Training',
    startDate: '2025-05-01',
    endDate: '2026-05-01',
  },
  {
    code: 'TRN-013',
    title: 'Cross-Cultural Communication',
    category: 'Diversity & Inclusion',
    provider: 'Global Voices',
    startDate: '2025-06-01',
    endDate: '2025-12-31',
  },
  {
    code: 'TRN-014',
    title: 'Unconscious Bias in Hiring',
    category: 'Diversity & Inclusion',
    provider: 'Global Voices',
    startDate: '2025-07-01',
    endDate: '2026-01-31',
  },
  {
    code: 'TRN-015',
    title: 'Cybersecurity Awareness for Staff',
    category: 'Compliance',
    provider: 'SecureNet Academy',
    startDate: '2025-08-01',
    endDate: '2026-08-01',
  },
];

/** Deterministic pseudo-random in [0, 1) from a string seed. */
function hashFraction(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return (hash % 1000) / 1000;
}

export function pickAssignmentStatus(employeeNo: string, trainingCode: string): TrainingStatus {
  const value = hashFraction(`${employeeNo}:${trainingCode}`);
  if (value < 0.45) return TrainingStatus.COMPLETED;
  if (value < 0.7) return TrainingStatus.IN_PROGRESS;
  if (value < 0.9) return TrainingStatus.NOT_STARTED;
  return TrainingStatus.EXPIRED;
}

export function pickCompletionDate(
  status: TrainingStatus,
  employeeNo: string,
  trainingCode: string,
): string | null {
  if (status !== TrainingStatus.COMPLETED && status !== TrainingStatus.EXPIRED) {
    return null;
  }
  const month = Math.floor(hashFraction(`${employeeNo}:${trainingCode}:month`) * 12);
  const day = 1 + Math.floor(hashFraction(`${employeeNo}:${trainingCode}:day`) * 27);
  const year = status === TrainingStatus.EXPIRED ? 2024 : 2025;
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function shouldAssignTraining(
  employeeNo: string,
  trainingCode: string,
): boolean {
  return hashFraction(`${employeeNo}:assign:${trainingCode}`) < 0.55;
}
