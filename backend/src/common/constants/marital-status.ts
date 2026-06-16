/** Mirrors `MaritalStatus` in prisma/schema.prisma — keep in sync. */
export const MARITAL_STATUS_VALUES = [
  'SINGLE',
  'MARRIED',
  'DIVORCED',
  'WIDOWED',
  'DOMESTIC_PARTNERSHIP',
] as const;

export type MaritalStatusValue = (typeof MARITAL_STATUS_VALUES)[number];
