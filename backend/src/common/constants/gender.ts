/** Mirrors `Gender` in prisma/schema.prisma — keep in sync. */
export const GENDER_VALUES = [
  'MALE',
  'FEMALE',
  'NON_BINARY',
  'PREFER_NOT_TO_SAY',
] as const;

export type GenderValue = (typeof GENDER_VALUES)[number];
