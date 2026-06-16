export const SENSITIVE_EMPLOYEE_FIELDS = [
  'employeeNo',
  'firstName',
  'lastName',
  'workEmail',
  'employmentStatus',
  'cityId',
  'hireDate',
  'managerEmployeeId',
] as const;

export type SensitiveEmployeeField = (typeof SENSITIVE_EMPLOYEE_FIELDS)[number];
