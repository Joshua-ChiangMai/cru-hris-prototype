import type { ProfileSectionId } from "./types";

export type ProfileNavItem = {
  id: ProfileSectionId;
  label: string;
};

export const PROFILE_NAV_ITEMS: ProfileNavItem[] = [
  { id: "basic", label: "Basic Information" },
  { id: "contact", label: "Contact Information" },
  { id: "worker", label: "Worker Information" },
  { id: "team", label: "Team Assignment History" },
  { id: "education", label: "Education Records" },
  { id: "languages", label: "Language Skills" },
  { id: "passport", label: "Passport Information" },
  { id: "insurance", label: "Insurance Information" },
];
