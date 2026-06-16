/** Mirrors `MarriageRequestStatus` in prisma/schema.prisma — keep in sync. */
export const MARRIAGE_REQUEST_STATUS_VALUES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
] as const;

export type MarriageRequestStatusValue =
  (typeof MARRIAGE_REQUEST_STATUS_VALUES)[number];
