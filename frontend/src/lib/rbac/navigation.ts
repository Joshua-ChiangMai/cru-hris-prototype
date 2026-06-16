import type { Session } from "@/lib/auth/types";
import { PERMISSIONS, type Permission } from "./permissions";

export type Role = "STAFF" | "HR" | "ADMIN";

export type NavigationItem = {
  href: string;
  label: string;
  /** Match when pathname equals or starts with href (default). */
  matchPrefix?: boolean;
  roles?: Role[];
  permissions?: Permission[];
  /** Minimum scope; omitted = any scope with permissions/roles satisfied. */
  minScope?: "OWN" | "CITY" | "ALL";
};

export type NavigationSection = {
  title?: string;
  items: NavigationItem[];
};

const CORE_NAV_ITEMS: NavigationItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    roles: ["STAFF", "HR", "ADMIN"],
  },
  {
    href: "/employees/me",
    label: "My Profile",
    roles: ["STAFF"],
    permissions: [PERMISSIONS.employeeView],
    minScope: "OWN",
  },
  {
    href: "/approvals/my-requests",
    label: "My Requests",
    roles: ["STAFF"],
    permissions: [PERMISSIONS.approvalView],
    minScope: "OWN",
  },
  {
    href: "/approvals/history",
    label: "Approval History",
    roles: ["STAFF"],
    permissions: [PERMISSIONS.approvalView],
    minScope: "OWN",
  },
  {
    href: "/employees",
    label: "Employee List",
    roles: ["HR", "ADMIN"],
    permissions: [PERMISSIONS.employeeView],
    minScope: "CITY",
  },
  {
    href: "/approvals",
    label: "Approval Center",
    roles: ["HR", "ADMIN"],
    permissions: [PERMISSIONS.approvalView, PERMISSIONS.approvalApprove],
    minScope: "CITY",
  },
  {
    href: "/approvals/history",
    label: "Approval History",
    roles: ["HR", "ADMIN"],
    permissions: [PERMISSIONS.approvalView],
    minScope: "CITY",
  },
  {
    href: "/reports",
    label: "Reports",
    roles: ["HR", "ADMIN"],
    permissions: [PERMISSIONS.reportView],
    minScope: "CITY",
  },
  {
    href: "/audit/logs",
    label: "Audit Logs",
    roles: ["ADMIN"],
    permissions: [PERMISSIONS.userView],
    minScope: "ALL",
  },
];

const FAMILY_NAV_ITEMS: NavigationItem[] = [
  {
    href: "/family/members",
    label: "Family Members",
    roles: ["STAFF", "HR", "ADMIN"],
    permissions: [PERMISSIONS.employeeView],
  },
  {
    href: "/family/information",
    label: "Family Information",
    roles: ["STAFF", "HR", "ADMIN"],
    permissions: [PERMISSIONS.employeeView],
  },
  {
    href: "/family/insurance",
    label: "Insurance",
    roles: ["STAFF", "HR", "ADMIN"],
    permissions: [PERMISSIONS.employeeView],
  },
  {
    href: "/family/emergency-contacts",
    label: "Emergency Contacts",
    roles: ["STAFF", "HR", "ADMIN"],
    permissions: [PERMISSIONS.employeeView],
  },
  {
    href: "/family/marriage-requests",
    label: "My Marriage Requests",
    roles: ["STAFF"],
    permissions: [PERMISSIONS.employeeView],
    minScope: "OWN",
  },
  {
    href: "/family/marriage-approval",
    label: "Marriage Approval Queue",
    roles: ["HR", "ADMIN"],
    permissions: [PERMISSIONS.approvalApprove],
    minScope: "CITY",
  },
];

/** @deprecated Use NAV_SECTIONS for grouped navigation. */
export const NAV_ITEMS: NavigationItem[] = [
  ...CORE_NAV_ITEMS,
  ...FAMILY_NAV_ITEMS,
];

export const NAV_SECTIONS: NavigationSection[] = [
  { title: "HR", items: CORE_NAV_ITEMS },
  { title: "Family", items: FAMILY_NAV_ITEMS },
];

const SCOPE_RANK = { OWN: 1, CITY: 2, ALL: 3 } as const;

function meetsMinScope(
  session: Session,
  minScope: NavigationItem["minScope"],
): boolean {
  if (!minScope) {
    return true;
  }
  return SCOPE_RANK[session.scopeLevel] >= SCOPE_RANK[minScope];
}

function hasNavPermission(session: Session, permissions?: Permission[]): boolean {
  if (!permissions || permissions.length === 0) {
    return true;
  }
  return permissions.every((p) => session.permissions.includes(p));
}

function hasNavRole(session: Session, roles?: Role[]): boolean {
  if (!roles || roles.length === 0) {
    return true;
  }
  return roles.some((role) => session.roleCodes.includes(role));
}

function filterNavItems(session: Session, items: NavigationItem[]): NavigationItem[] {
  return items.filter(
    (item) =>
      hasNavRole(session, item.roles) &&
      hasNavPermission(session, item.permissions) &&
      meetsMinScope(session, item.minScope),
  );
}

export function getNavSectionsForSession(session: Session): NavigationSection[] {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: filterNavItems(session, section.items),
  })).filter((section) => section.items.length > 0);
}

export function getNavItemsForSession(session: Session): NavigationItem[] {
  return getNavSectionsForSession(session).flatMap((section) => section.items);
}

export function getNavItemsForRole(role: Role): NavigationItem[] {
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));
}
