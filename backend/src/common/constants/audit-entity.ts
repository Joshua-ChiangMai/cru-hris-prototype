/** Mirrors `AuditEntity` in prisma/schema.prisma — keep in sync. */
export const AUDIT_ENTITY_VALUES = [
  'EMPLOYEE_PROFILE',
  'FAMILY',
  'UPDATE_REQUEST',
] as const;

export type AuditEntityValue = (typeof AUDIT_ENTITY_VALUES)[number];
