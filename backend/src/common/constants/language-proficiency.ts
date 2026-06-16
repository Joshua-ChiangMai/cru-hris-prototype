/** Mirrors `LanguageProficiency` in prisma/schema.prisma — keep in sync. */
export const LANGUAGE_PROFICIENCY_VALUES = [
  'BASIC',
  'CONVERSATIONAL',
  'FLUENT',
  'NATIVE',
] as const;

export type LanguageProficiencyValue =
  (typeof LANGUAGE_PROFICIENCY_VALUES)[number];
