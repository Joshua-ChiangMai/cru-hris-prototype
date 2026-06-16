/** Mirrors `AuditAction` in prisma/schema.prisma — keep in sync. */
export const AUDIT_ACTION_VALUES = [
  'UPDATE',
  'SUBMIT',
  'APPROVE',
  'REJECT',
  'CANCEL',
] as const;

export type AuditActionValue = (typeof AUDIT_ACTION_VALUES)[number];
