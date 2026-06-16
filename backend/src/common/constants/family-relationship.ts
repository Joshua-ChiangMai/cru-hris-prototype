/** Mirrors `FamilyRelationship` in prisma/schema.prisma — keep in sync. */
export const FAMILY_RELATIONSHIP_VALUES = [
  'WORKER',
  'SPOUSE',
  'SON',
  'DAUGHTER',
  'PARENT',
] as const;

export type FamilyRelationshipValue =
  (typeof FAMILY_RELATIONSHIP_VALUES)[number];
