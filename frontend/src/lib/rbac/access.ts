import type { Session } from "@/lib/auth/types";
import { PERMISSIONS, type Permission } from "./permissions";
import type { Role } from "./navigation";

export function hasPermission(session: Session, permission: Permission): boolean {
  return session.permissions.includes(permission);
}

export function hasAnyPermission(
  session: Session,
  permissions: Permission[],
): boolean {
  return permissions.some((p) => session.permissions.includes(p));
}

export function hasRole(session: Session, role: Role): boolean {
  return session.roleCodes.includes(role);
}

export function getPrimaryRole(session: Session): Role {
  if (session.roleCodes.includes("ADMIN")) {
    return "ADMIN";
  }
  if (session.roleCodes.includes("HR")) {
    return "HR";
  }
  return "STAFF";
}

/**
 * Client-side route guard aligned with backend RBAC (permissions + scope).
 */
export function canAccessPath(session: Session, pathname: string): boolean {
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    return true;
  }

  if (pathname.startsWith("/employees/me")) {
    return hasPermission(session, PERMISSIONS.employeeView);
  }

  if (pathname.startsWith("/employees")) {
    return (
      hasPermission(session, PERMISSIONS.employeeView) &&
      session.scopeLevel !== "OWN"
    );
  }

  if (pathname.startsWith("/approvals")) {
    return hasPermission(session, PERMISSIONS.approvalView);
  }

  if (pathname.startsWith("/reports")) {
    return (
      hasPermission(session, PERMISSIONS.reportView) &&
      session.scopeLevel !== "OWN"
    );
  }

  if (pathname.startsWith("/audit")) {
    return (
      hasRole(session, "ADMIN") &&
      hasPermission(session, PERMISSIONS.userView) &&
      session.scopeLevel === "ALL"
    );
  }

  if (pathname.startsWith("/family/marriage-approval")) {
    return (
      hasPermission(session, PERMISSIONS.approvalApprove) &&
      session.scopeLevel !== "OWN"
    );
  }

  if (pathname.startsWith("/family/marriage-requests")) {
    return hasPermission(session, PERMISSIONS.employeeView);
  }

  if (pathname.startsWith("/family")) {
    return hasPermission(session, PERMISSIONS.employeeView);
  }

  return true;
}
