/** Mirrors `EmploymentStatus` in prisma/schema.prisma — keep in sync. */
export const EMPLOYMENT_STATUS_VALUES = [
  'ACTIVE',
  'INACTIVE',
  'TERMINATED',
] as const;

export type EmploymentStatusValue =
  (typeof EMPLOYMENT_STATUS_VALUES)[number];
