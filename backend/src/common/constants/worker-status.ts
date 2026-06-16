/** Mirrors `WorkerStatus` in prisma/schema.prisma — keep in sync. */
export const WORKER_STATUS_VALUES = [
  'ACTIVE',
  'ON_LEAVE',
  'INACTIVE',
  'TERMINATED',
] as const;

export type WorkerStatusValue = (typeof WORKER_STATUS_VALUES)[number];
