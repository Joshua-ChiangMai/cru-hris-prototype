import { Injectable } from '@nestjs/common';
import { ApprovalChangeDomain, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ProfileSnapshotService } from '../../common/services/profile-snapshot.service';
import { ProfileService } from '../profile/profile.service';
import { FamilyService } from '../family/family.service';
import type { EmployeeProfilePayload } from '../../common/services/profile-snapshot.service';

@Injectable()
export class ApprovalChangeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profileSnapshot: ProfileSnapshotService,
    private readonly profileService: ProfileService,
    private readonly familyService: FamilyService,
  ) {}

  payloadsEqual(
    before: Record<string, unknown>,
    after: Record<string, unknown>,
  ): boolean {
    return JSON.stringify(before) === JSON.stringify(after);
  }

  async applyApprovedChange(
    targetEmployeeId: string,
    changeDomain: ApprovalChangeDomain | null,
    payloadAfter: Record<string, unknown>,
  ): Promise<void> {
    if (!changeDomain) {
      await this.applyLegacyPayload(targetEmployeeId, payloadAfter);
      return;
    }

    switch (changeDomain) {
      case ApprovalChangeDomain.PERSONAL_INFORMATION:
        await this.applyPersonalInformation(targetEmployeeId, payloadAfter);
        break;
      case ApprovalChangeDomain.CONTACT_INFORMATION:
        await this.applyContactInformation(targetEmployeeId, payloadAfter);
        break;
      case ApprovalChangeDomain.PASSPORT_INFORMATION:
        await this.applyPassportInformation(targetEmployeeId, payloadAfter);
        break;
      case ApprovalChangeDomain.FAMILY_INFORMATION:
        await this.applyFamilyInformation(payloadAfter);
        break;
      default:
        await this.applyLegacyPayload(targetEmployeeId, payloadAfter);
    }
  }

  private async applyLegacyPayload(
    targetEmployeeId: string,
    payloadAfter: Record<string, unknown>,
  ) {
    if (payloadAfter.profile && typeof payloadAfter.profile === 'object') {
      await this.profileService.applyProfile(
        targetEmployeeId,
        payloadAfter.profile as EmployeeProfilePayload,
      );
      return;
    }

    if (payloadAfter.family && typeof payloadAfter.family === 'object') {
      await this.familyService.applyFamily(
        payloadAfter.family as Parameters<FamilyService['applyFamily']>[0],
      );
      return;
    }

    await this.prisma.employee.update({
      where: { id: targetEmployeeId },
      data: this.buildEmployeeUpdateFromPayload(payloadAfter),
    });
  }

  private buildEmployeeUpdateFromPayload(
    payload: Record<string, unknown>,
  ): Prisma.EmployeeUpdateInput {
    const data: Prisma.EmployeeUpdateInput = {};

    if (payload.employeeNo !== undefined) {
      data.employeeNo = String(payload.employeeNo);
    }
    if (payload.firstName !== undefined) {
      data.firstName = String(payload.firstName);
    }
    if (payload.lastName !== undefined) {
      data.lastName = String(payload.lastName);
    }
    if (payload.workEmail !== undefined) {
      data.workEmail = payload.workEmail ? String(payload.workEmail) : null;
    }
    if (payload.employmentStatus !== undefined) {
      data.employmentStatus = payload.employmentStatus as never;
    }
    if (payload.cityId !== undefined) {
      data.city = { connect: { id: String(payload.cityId) } };
    }
    if (payload.hireDate !== undefined) {
      data.hireDate = payload.hireDate
        ? new Date(String(payload.hireDate))
        : null;
    }
    if (payload.managerEmployeeId !== undefined) {
      data.manager = payload.managerEmployeeId
        ? { connect: { id: String(payload.managerEmployeeId) } }
        : { disconnect: true };
    }
    if (payload.phone !== undefined) {
      data.phone = payload.phone ? String(payload.phone) : null;
    }
    if (payload.jobTitle !== undefined) {
      data.jobTitle = payload.jobTitle ? String(payload.jobTitle) : null;
    }
    if (payload.department !== undefined) {
      data.department = payload.department ? String(payload.department) : null;
    }

    return data;
  }

  private async loadProfile(employeeId: string) {
    const employee = await this.profileSnapshot.loadEmployeeWithProfile(employeeId);
    if (!employee) {
      throw new Error('Employee not found for profile apply');
    }
    return this.profileSnapshot.serializeProfile(employee);
  }

  private async applyPersonalInformation(
    employeeId: string,
    payloadAfter: Record<string, unknown>,
  ) {
    const current = await this.loadProfile(employeeId);
    const merged = {
      ...current,
      basic: {
        ...current.basic,
        ...(payloadAfter.basic as typeof current.basic),
      },
    };
    await this.profileService.applyProfile(employeeId, merged);
  }

  private async applyContactInformation(
    employeeId: string,
    payloadAfter: Record<string, unknown>,
  ) {
    const current = await this.loadProfile(employeeId);
    const merged = {
      ...current,
      contact: {
        ...current.contact,
        ...(payloadAfter.contact as typeof current.contact),
      },
    };
    await this.profileService.applyProfile(employeeId, merged);
  }

  private async applyPassportInformation(
    employeeId: string,
    payloadAfter: Record<string, unknown>,
  ) {
    const current = await this.loadProfile(employeeId);
    const merged = {
      ...current,
      passports: payloadAfter.passports as typeof current.passports,
    };
    await this.profileService.applyProfile(employeeId, merged);
  }

  private async applyFamilyInformation(payloadAfter: Record<string, unknown>) {
    await this.familyService.applyFamily(
      payloadAfter.family as Parameters<FamilyService['applyFamily']>[0],
    );
  }
}
