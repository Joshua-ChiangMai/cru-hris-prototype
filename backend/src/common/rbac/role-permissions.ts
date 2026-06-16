import { RoleCode } from '@prisma/client';
import { PERMISSIONS, PermissionKey } from '../constants/permissions';

/** Canonical role → permission mapping aligned with docs/RBAC.md */
export const ROLE_PERMISSIONS: Record<RoleCode, PermissionKey[]> = {
  [RoleCode.STAFF]: [
    PERMISSIONS.employeeView,
    PERMISSIONS.employeeEdit,
    PERMISSIONS.approvalView,
  ],
  [RoleCode.HR]: [
    PERMISSIONS.employeeView,
    PERMISSIONS.employeeEdit,
    PERMISSIONS.approvalView,
    PERMISSIONS.approvalApprove,
    PERMISSIONS.reportView,
    PERMISSIONS.reportExport,
    PERMISSIONS.userView,
    PERMISSIONS.userEdit,
  ],
  [RoleCode.ADMIN]: [
    PERMISSIONS.employeeView,
    PERMISSIONS.employeeEdit,
    PERMISSIONS.employeeDelete,
    PERMISSIONS.approvalView,
    PERMISSIONS.approvalApprove,
    PERMISSIONS.reportView,
    PERMISSIONS.reportExport,
    PERMISSIONS.userView,
    PERMISSIONS.userEdit,
    PERMISSIONS.userDelete,
  ],
};

export function permissionsForRoles(roles: RoleCode[]): PermissionKey[] {
  const set = new Set<PermissionKey>();
  for (const role of roles) {
    for (const permission of ROLE_PERMISSIONS[role]) {
      set.add(permission);
    }
  }
  return [...set];
}
