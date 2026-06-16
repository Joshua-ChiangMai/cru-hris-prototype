export type ApprovalChangeDomain =
  | "PERSONAL_INFORMATION"
  | "CONTACT_INFORMATION"
  | "FAMILY_INFORMATION"
  | "PASSPORT_INFORMATION";

export const DOMAIN_LABELS: Record<ApprovalChangeDomain, string> = {
  PERSONAL_INFORMATION: "Personal Information",
  CONTACT_INFORMATION: "Contact Information",
  FAMILY_INFORMATION: "Family Information",
  PASSPORT_INFORMATION: "Passport Information",
};

export const GATED_PROFILE_SECTIONS = new Set([
  "basic",
  "contact",
  "passport",
]);

export function sectionRequiresApproval(section: string): boolean {
  return GATED_PROFILE_SECTIONS.has(section);
}
