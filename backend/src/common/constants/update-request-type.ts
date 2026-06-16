/** Mirrors `UpdateRequestType` in prisma/schema.prisma — keep in sync. */
export const UPDATE_REQUEST_TYPE_VALUES = [
  'PROFILE_UPDATE',
  'SENSITIVE_FIELD_UPDATE',
] as const;

export type UpdateRequestTypeValue =
  (typeof UPDATE_REQUEST_TYPE_VALUES)[number];
