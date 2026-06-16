import { Injectable } from '@nestjs/common';
import { SENSITIVE_EMPLOYEE_FIELDS } from '../constants/sensitive-employee-fields';

@Injectable()
export class SensitiveFieldsService {
  extractSensitiveChanges(
    current: Record<string, unknown>,
    proposed: Record<string, unknown>,
  ): Record<string, unknown> {
    const changes: Record<string, unknown> = {};

    for (const field of SENSITIVE_EMPLOYEE_FIELDS) {
      if (!(field in proposed)) {
        continue;
      }

      const nextValue = proposed[field];
      const currentValue = current[field];

      if (!this.valuesEqual(currentValue, nextValue)) {
        changes[field] = nextValue;
      }
    }

    return changes;
  }

  requiresApprovalForPayload(
    canEditAllFields: boolean,
    current: Record<string, unknown>,
    proposed: Record<string, unknown>,
  ): boolean {
    if (canEditAllFields) {
      return false;
    }

    return (
      Object.keys(this.extractSensitiveChanges(current, proposed)).length > 0
    );
  }

  buildEmployeeSnapshot(employee: {
    employeeNo: string;
    firstName: string;
    lastName: string;
    workEmail: string | null;
    phone: string | null;
    jobTitle: string | null;
    employmentStatus: string;
    cityId: string;
    hireDate: Date | null;
    managerEmployeeId: string | null;
  }): Record<string, unknown> {
    return {
      employeeNo: employee.employeeNo,
      firstName: employee.firstName,
      lastName: employee.lastName,
      workEmail: employee.workEmail,
      phone: employee.phone,
      jobTitle: employee.jobTitle,
      employmentStatus: employee.employmentStatus,
      cityId: employee.cityId,
      hireDate: employee.hireDate?.toISOString().slice(0, 10) ?? null,
      managerEmployeeId: employee.managerEmployeeId,
    };
  }

  private valuesEqual(a: unknown, b: unknown): boolean {
    if (a instanceof Date && typeof b === 'string') {
      return a.toISOString().slice(0, 10) === b;
    }
    return a === b;
  }
}
