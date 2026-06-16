/** Profile field paths (dot notation) requiring approval when changed by Staff. */
export const SENSITIVE_PROFILE_PATHS = [
  'basic.dateOfBirth',
  'basic.citizenship',
  'basic.rcNumber',
  'basic.firstName',
  'basic.lastName',
  'basic.gender',
  'basic.maritalStatus',
  'worker.workerStatus',
  'worker.terminationDate',
  'worker.salarySource',
  'passports',
  'insurance',
] as const;

export type SensitiveProfilePath = (typeof SENSITIVE_PROFILE_PATHS)[number];
