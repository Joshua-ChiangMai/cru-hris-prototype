export const SENSITIVE_EMPLOYEE_FIELDS = [
  "employeeNo",
  "firstName",
  "lastName",
  "workEmail",
  "employmentStatus",
  "cityId",
  "hireDate",
  "managerEmployeeId",
] as const;

export function extractSensitiveChanges(
  current: Record<string, unknown>,
  proposed: Record<string, unknown>
): Record<string, unknown> {
  const changes: Record<string, unknown> = {};

  for (const field of SENSITIVE_EMPLOYEE_FIELDS) {
    if (!(field in proposed)) continue;
    if (current[field] !== proposed[field]) {
      changes[field] = proposed[field];
    }
  }

  return changes;
}

export function hasSensitiveChanges(
  current: Record<string, unknown>,
  proposed: Record<string, unknown>
): boolean {
  return Object.keys(extractSensitiveChanges(current, proposed)).length > 0;
}
