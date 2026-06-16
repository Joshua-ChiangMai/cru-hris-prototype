/** Mirrors `UpdateRequestStatus` in prisma/schema.prisma — keep in sync. */
export const UPDATE_REQUEST_STATUS_VALUES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
] as const;

export type UpdateRequestStatusValue =
  (typeof UPDATE_REQUEST_STATUS_VALUES)[number];
