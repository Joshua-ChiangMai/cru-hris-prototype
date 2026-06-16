export const PERMISSIONS = {
  approvalApprove: "approval_center:approve",
  approvalView: "approval_center:view",
  employeeDelete: "employee_profile:delete",
  employeeEdit: "employee_profile:edit",
  employeeView: "employee_profile:view",
  reportExport: "reports:export",
  reportView: "reports:view",
  userDelete: "user_management:delete",
  userEdit: "user_management:edit",
  userView: "user_management:view",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
