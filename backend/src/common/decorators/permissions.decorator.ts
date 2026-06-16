import { SetMetadata } from '@nestjs/common';
import { PermissionKey } from '../constants/permissions';

export const PERMISSION_METADATA_KEY = 'required_permissions';

export type PermissionRequirement = {
  permissions: PermissionKey[];
  mode: 'all' | 'any';
};

export const RequirePermissions = (...permissions: PermissionKey[]) =>
  SetMetadata(PERMISSION_METADATA_KEY, {
    permissions,
    mode: 'all',
  } satisfies PermissionRequirement);

export const RequireAnyPermission = (...permissions: PermissionKey[]) =>
  SetMetadata(PERMISSION_METADATA_KEY, {
    permissions,
    mode: 'any',
  } satisfies PermissionRequirement);
