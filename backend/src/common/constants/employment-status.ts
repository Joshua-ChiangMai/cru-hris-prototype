/**
 * Validation-safe employment status values for DTOs.
 * Mirrors `EmploymentStatus` in prisma/schema.prisma — keep in sync.
 * Do not import Prisma enums in DTO decorators; they are undefined until
 * `prisma generate` runs (e.g. Docker deps stage without generate).
 */
export const EMPLOYMENT_STATUS_VALUES = [
  'ACTIVE',
  'INACTIVE',
  'TERMINATED',
] as const;

export type EmploymentStatusValue =
  (typeof EMPLOYMENT_STATUS_VALUES)[number];
