/** Mirrors `WorkerType` in prisma/schema.prisma — keep in sync. */
export const WORKER_TYPE_VALUES = [
  'FULL_TIME',
  'PART_TIME',
  'INTERN',
  'VOLUNTEER',
  'CONTRACT',
] as const;

export type WorkerTypeValue = (typeof WORKER_TYPE_VALUES)[number];
