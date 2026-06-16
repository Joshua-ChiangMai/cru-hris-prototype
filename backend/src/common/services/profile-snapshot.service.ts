import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const profileInclude = {
  basicInfo: true,
  contactInfo: true,
  workerInfo: true,
  teamAssignments: { where: { deletedAt: null }, orderBy: { startDate: 'desc' as const } },
  educationRecords: { where: { deletedAt: null }, orderBy: { graduationYear: 'desc' as const } },
  languageSkills: { where: { deletedAt: null }, orderBy: { language: 'asc' as const } },
  passports: { where: { deletedAt: null }, orderBy: { expiryDate: 'desc' as const } },
  insuranceRecords: { where: { deletedAt: null }, orderBy: { effectiveDate: 'desc' as const } },
} satisfies Prisma.EmployeeInclude;

export type EmployeeProfilePayload = ReturnType<ProfileSnapshotService['serializeProfile']>;

@Injectable()
export class ProfileSnapshotService {
  constructor(private readonly prisma: PrismaService) {}

  async loadEmployeeWithProfile(employeeId: string) {
    return this.prisma.employee.findFirst({
      where: { id: employeeId, deletedAt: null },
      include: profileInclude,
    });
  }

  serializeProfile(
    employee: NonNullable<
      Awaited<ReturnType<ProfileSnapshotService['loadEmployeeWithProfile']>>
    >,
  ) {
    return {
      employeeId: employee.id,
      basic: {
        firstName: employee.firstName,
        lastName: employee.lastName,
        preferredName: employee.basicInfo?.preferredName ?? null,
        dateOfBirth: this.dateStr(employee.basicInfo?.dateOfBirth),
        gender: employee.gender,
        maritalStatus: employee.maritalStatus,
        citizenship: employee.basicInfo?.citizenship ?? null,
        rcNumber: employee.basicInfo?.rcNumber ?? null,
      },
      contact: {
        primaryAddressLine1: employee.contactInfo?.primaryAddressLine1 ?? null,
        primaryAddressLine2: employee.contactInfo?.primaryAddressLine2 ?? null,
        primaryCity: employee.contactInfo?.primaryCity ?? null,
        primaryState: employee.contactInfo?.primaryState ?? null,
        primaryPostalCode: employee.contactInfo?.primaryPostalCode ?? null,
        primaryCountry: employee.contactInfo?.primaryCountry ?? null,
        mailingAddressLine1: employee.contactInfo?.mailingAddressLine1 ?? null,
        mailingAddressLine2: employee.contactInfo?.mailingAddressLine2 ?? null,
        mailingCity: employee.contactInfo?.mailingCity ?? null,
        mailingState: employee.contactInfo?.mailingState ?? null,
        mailingPostalCode: employee.contactInfo?.mailingPostalCode ?? null,
        mailingCountry: employee.contactInfo?.mailingCountry ?? null,
        phonePrimary: employee.contactInfo?.phonePrimary ?? employee.phone,
        phoneSecondary: employee.contactInfo?.phoneSecondary ?? null,
        emailPrimary: employee.contactInfo?.emailPrimary ?? employee.workEmail,
        emailSecondary: employee.contactInfo?.emailSecondary ?? null,
        signalAccount: employee.contactInfo?.signalAccount ?? null,
      },
      worker: {
        workerType: employee.workerInfo?.workerType ?? null,
        workerStatus: employee.workerInfo?.workerStatus ?? null,
        internStartDate: this.dateStr(employee.workerInfo?.internStartDate),
        ministryJoinDate: this.dateStr(employee.workerInfo?.ministryJoinDate),
        workerJoinDate: this.dateStr(employee.workerInfo?.workerJoinDate),
        terminationDate: this.dateStr(employee.workerInfo?.terminationDate),
        sendingRegion: employee.workerInfo?.sendingRegion ?? null,
        salarySource: employee.workerInfo?.salarySource ?? null,
      },
      teamAssignments: employee.teamAssignments.map((row) => ({
        id: row.id,
        team: row.team,
        position: row.position,
        startDate: this.dateStr(row.startDate)!,
        endDate: this.dateStr(row.endDate),
        isPrimary: row.isPrimary,
      })),
      education: employee.educationRecords.map((row) => ({
        id: row.id,
        degree: row.degree,
        major: row.major,
        school: row.school,
        graduationYear: row.graduationYear,
        notes: row.notes,
      })),
      languages: employee.languageSkills.map((row) => ({
        id: row.id,
        language: row.language,
        proficiency: row.proficiency,
      })),
      passports: employee.passports.map((row) => ({
        id: row.id,
        passportNumber: row.passportNumber,
        country: row.country,
        issueDate: this.dateStr(row.issueDate),
        expiryDate: this.dateStr(row.expiryDate),
      })),
      insurance: employee.insuranceRecords.map((row) => ({
        id: row.id,
        insuranceProvider: row.insuranceProvider,
        policyNumber: row.policyNumber,
        effectiveDate: this.dateStr(row.effectiveDate),
      })),
    };
  }

  profileDiff(
    before: Record<string, unknown>,
    after: Record<string, unknown>,
  ): boolean {
    return JSON.stringify(before) !== JSON.stringify(after);
  }

  requiresApprovalForProfileChange(
    canEditAllFields: boolean,
    before: Record<string, unknown>,
    after: Record<string, unknown>,
  ): boolean {
    if (canEditAllFields) {
      return false;
    }

    const beforeBasic = before.basic as Record<string, unknown> | undefined;
    const afterBasic = after.basic as Record<string, unknown> | undefined;
    if (beforeBasic && afterBasic) {
      for (const key of [
        'dateOfBirth',
        'citizenship',
        'rcNumber',
        'firstName',
        'lastName',
        'gender',
        'maritalStatus',
      ]) {
        if (beforeBasic[key] !== afterBasic[key]) {
          return true;
        }
      }
    }

    const beforeWorker = before.worker as Record<string, unknown> | undefined;
    const afterWorker = after.worker as Record<string, unknown> | undefined;
    if (beforeWorker && afterWorker) {
      for (const key of ['workerStatus', 'terminationDate', 'salarySource']) {
        if (beforeWorker[key] !== afterWorker[key]) {
          return true;
        }
      }
    }

    if (JSON.stringify(before.passports) !== JSON.stringify(after.passports)) {
      return true;
    }
    if (JSON.stringify(before.insurance) !== JSON.stringify(after.insurance)) {
      return true;
    }

    return false;
  }

  private dateStr(value: Date | null | undefined): string | null {
    return value ? value.toISOString().slice(0, 10) : null;
  }
}
