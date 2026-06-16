import { ApprovalChangeDomain } from '@prisma/client';

export const APPROVAL_GATED_DOMAINS: ApprovalChangeDomain[] = [
  ApprovalChangeDomain.PERSONAL_INFORMATION,
  ApprovalChangeDomain.CONTACT_INFORMATION,
  ApprovalChangeDomain.FAMILY_INFORMATION,
  ApprovalChangeDomain.PASSPORT_INFORMATION,
];

export const DOMAIN_LABELS: Record<ApprovalChangeDomain, string> = {
  [ApprovalChangeDomain.PERSONAL_INFORMATION]: 'Personal Information',
  [ApprovalChangeDomain.CONTACT_INFORMATION]: 'Contact Information',
  [ApprovalChangeDomain.FAMILY_INFORMATION]: 'Family Information',
  [ApprovalChangeDomain.PASSPORT_INFORMATION]: 'Passport Information',
};

/** Profile section id → approval domain (Phase 3 gated sections). */
export const PROFILE_SECTION_DOMAIN: Record<
  string,
  ApprovalChangeDomain | undefined
> = {
  basic: ApprovalChangeDomain.PERSONAL_INFORMATION,
  contact: ApprovalChangeDomain.CONTACT_INFORMATION,
  passport: ApprovalChangeDomain.PASSPORT_INFORMATION,
};
