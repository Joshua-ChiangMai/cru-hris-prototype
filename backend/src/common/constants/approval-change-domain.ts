/** Mirrors `ApprovalChangeDomain` in prisma/schema.prisma — keep in sync. */
export const APPROVAL_CHANGE_DOMAIN_VALUES = [
  'PERSONAL_INFORMATION',
  'CONTACT_INFORMATION',
  'FAMILY_INFORMATION',
  'PASSPORT_INFORMATION',
] as const;

export type ApprovalChangeDomainValue =
  (typeof APPROVAL_CHANGE_DOMAIN_VALUES)[number];
