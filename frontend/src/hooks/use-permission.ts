"use client";

import { useAuth } from "@/context/auth-provider";
import {
  hasAnyPermission,
  hasPermission,
  hasRole,
  type Permission,
  type Role,
} from "@/lib/rbac";

export function usePermission(permission: Permission): boolean {
  const { session } = useAuth();
  if (!session) {
    return false;
  }
  return hasPermission(session, permission);
}

export function useAnyPermission(permissions: Permission[]): boolean {
  const { session } = useAuth();
  if (!session) {
    return false;
  }
  return hasAnyPermission(session, permissions);
}

export function useRole(role: Role): boolean {
  const { session } = useAuth();
  if (!session) {
    return false;
  }
  return hasRole(session, role);
}
