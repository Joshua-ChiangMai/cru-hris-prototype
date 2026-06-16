import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, AuditEntity, Prisma } from '@prisma/client';
import { AuditLogService } from '../../common/services/audit-log.service';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { ProfileSnapshotService } from '../../common/services/profile-snapshot.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EmployeeScopeService } from '../employees/employee-scope.service';
import { PROFILE_SECTION_DOMAIN } from '../../common/constants/approval-change-domains';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scopeService: EmployeeScopeService,
    private readonly profileSnapshot: ProfileSnapshotService,
    private readonly auditLog: AuditLogService,
  ) {}

  async getMyProfile(authUser: AuthUser) {
    const employee = await this.prisma.employee.findFirst({
      where: { userId: authUser.userId, deletedAt: null },
      select: { id: true },
    });

    if (!employee) {
      throw new NotFoundException('Employee profile not linked to this user');
    }

    return this.getProfile(employee.id, authUser);
  }

  async updateMyProfile(payload: UpdateProfileDto, authUser: AuthUser) {
    const employee = await this.prisma.employee.findFirst({
      where: { userId: authUser.userId, deletedAt: null },
      select: { id: true },
    });

    if (!employee) {
      throw new NotFoundException('Employee profile not linked to this user');
    }

    return this.updateProfile(employee.id, payload, authUser);
  }

  async getProfile(employeeId: string, authUser: AuthUser) {
    const employee = await this.profileSnapshot.loadEmployeeWithProfile(employeeId);

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    await this.scopeService.assertCanAccessEmployee(authUser, employee);

    return {
      data: this.profileSnapshot.serializeProfile(employee),
      meta: {
        canEdit: this.scopeService.canEditEmployee(authUser, employee),
        canEditAllFields: this.scopeService.canEditAllFields(authUser),
      },
    };
  }

  async updateProfile(
    employeeId: string,
    payload: UpdateProfileDto,
    authUser: AuthUser,
  ) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, deletedAt: null },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    await this.scopeService.assertCanAccessEmployee(authUser, employee);

    if (!this.scopeService.canEditEmployee(authUser, employee)) {
      throw new ForbiddenException('You cannot edit this profile');
    }

    const loaded = await this.profileSnapshot.loadEmployeeWithProfile(employeeId);
    if (!loaded) {
      throw new NotFoundException('Employee not found');
    }

    const canDirectEdit = this.scopeService.canEditAllFields(authUser);

    if (!canDirectEdit && this.payloadRequiresApproval(payload)) {
      throw new BadRequestException({
        message:
          'Changes to Personal, Contact, or Passport information require HR approval. Submit a change request.',
        code: 'APPROVAL_REQUIRED',
      });
    }

    const before = this.profileSnapshot.serializeProfile(loaded);
    const after = this.mergeProfileUpdate(before, payload);

    if (
      !canDirectEdit &&
      this.profileSnapshot.requiresApprovalForProfileChange(
        false,
        before as unknown as Record<string, unknown>,
        after as unknown as Record<string, unknown>,
      )
    ) {
      throw new BadRequestException({
        message:
          'Profile changes require approval. Submit a change request.',
        code: 'APPROVAL_REQUIRED',
      });
    }

    await this.applyProfile(employeeId, after);

    await this.auditLog.record({
      actorUserId: authUser.userId,
      action: AuditAction.UPDATE,
      entity: AuditEntity.EMPLOYEE_PROFILE,
      entityId: employeeId,
      entityLabel: employee.employeeNo,
      beforeValue: before,
      afterValue: after,
    });

    const updated = await this.profileSnapshot.loadEmployeeWithProfile(employeeId);
    return {
      data: this.profileSnapshot.serializeProfile(updated!),
      meta: {
        canEdit: true,
        canEditAllFields: this.scopeService.canEditAllFields(authUser),
      },
    };
  }

  mergeProfileUpdate(
    current: ReturnType<ProfileSnapshotService['serializeProfile']>,
    payload: UpdateProfileDto,
  ) {
    const next = structuredClone(current);

    if (payload.basic) {
      next.basic = { ...next.basic, ...payload.basic };
    }
    if (payload.contact) {
      next.contact = { ...next.contact, ...payload.contact };
    }
    if (payload.worker) {
      next.worker = { ...next.worker, ...payload.worker };
    }
    if (payload.teamAssignments) {
      next.teamAssignments = payload.teamAssignments.map((row) => ({
        id: row.id ?? '',
        team: row.team,
        position: row.position,
        startDate: row.startDate,
        endDate: row.endDate ?? null,
        isPrimary: row.isPrimary ?? false,
      }));
    }
    if (payload.education) {
      next.education = payload.education.map((row) => ({
        id: row.id ?? '',
        degree: row.degree,
        major: row.major ?? null,
        school: row.school,
        graduationYear: row.graduationYear ?? null,
        notes: row.notes ?? null,
      }));
    }
    if (payload.languages) {
      next.languages = payload.languages.map((row) => ({
        id: row.id ?? '',
        language: row.language,
        proficiency: row.proficiency,
      }));
    }
    if (payload.passports) {
      next.passports = payload.passports.map((row) => ({
        id: row.id ?? '',
        passportNumber: row.passportNumber,
        country: row.country,
        issueDate: row.issueDate ?? null,
        expiryDate: row.expiryDate ?? null,
      }));
    }
    if (payload.insurance) {
      next.insurance = payload.insurance.map((row) => ({
        id: row.id ?? '',
        insuranceProvider: row.insuranceProvider,
        policyNumber: row.policyNumber,
        effectiveDate: row.effectiveDate ?? null,
      }));
    }

    return next;
  }

  async applyProfile(
    employeeId: string,
    profile: ReturnType<ProfileSnapshotService['serializeProfile']>,
  ) {
    await this.prisma.$transaction(async (tx) => {
      await tx.employee.update({
        where: { id: employeeId },
        data: {
          firstName: profile.basic.firstName,
          lastName: profile.basic.lastName,
          gender: profile.basic.gender ?? undefined,
          maritalStatus: profile.basic.maritalStatus ?? undefined,
          phone: profile.contact.phonePrimary ?? undefined,
          workEmail: profile.contact.emailPrimary ?? undefined,
        },
      });

      await tx.employeeBasicInfo.upsert({
        where: { employeeId },
        create: {
          employeeId,
          preferredName: profile.basic.preferredName,
          dateOfBirth: this.parseDate(profile.basic.dateOfBirth),
          citizenship: profile.basic.citizenship,
          rcNumber: profile.basic.rcNumber,
        },
        update: {
          preferredName: profile.basic.preferredName,
          dateOfBirth: this.parseDate(profile.basic.dateOfBirth),
          citizenship: profile.basic.citizenship,
          rcNumber: profile.basic.rcNumber,
        },
      });

      await tx.employeeContactInfo.upsert({
        where: { employeeId },
        create: { employeeId, ...this.contactData(profile.contact) },
        update: this.contactData(profile.contact),
      });

      await tx.employeeWorkerInfo.upsert({
        where: { employeeId },
        create: { employeeId, ...this.workerData(profile.worker) },
        update: this.workerData(profile.worker),
      });

      await tx.employeeTeamAssignment.updateMany({
        where: { employeeId, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      for (const row of profile.teamAssignments) {
        await tx.employeeTeamAssignment.create({
          data: {
            employeeId,
            team: row.team,
            position: row.position,
            startDate: new Date(row.startDate),
            endDate: this.parseDate(row.endDate),
            isPrimary: row.isPrimary,
          },
        });
      }

      await tx.employeeEducation.updateMany({
        where: { employeeId, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      for (const row of profile.education) {
        await tx.employeeEducation.create({
          data: {
            employeeId,
            degree: row.degree,
            major: row.major,
            school: row.school,
            graduationYear: row.graduationYear,
            notes: row.notes,
          },
        });
      }

      await tx.employeeLanguageSkill.updateMany({
        where: { employeeId, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      for (const row of profile.languages) {
        await tx.employeeLanguageSkill.create({
          data: {
            employeeId,
            language: row.language,
            proficiency: row.proficiency,
          },
        });
      }

      await tx.employeePassport.updateMany({
        where: { employeeId, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      for (const row of profile.passports) {
        await tx.employeePassport.create({
          data: {
            employeeId,
            passportNumber: row.passportNumber,
            country: row.country,
            issueDate: this.parseDate(row.issueDate),
            expiryDate: this.parseDate(row.expiryDate),
          },
        });
      }

      await tx.employeeInsurance.updateMany({
        where: { employeeId, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      for (const row of profile.insurance) {
        await tx.employeeInsurance.create({
          data: {
            employeeId,
            insuranceProvider: row.insuranceProvider,
            policyNumber: row.policyNumber,
            effectiveDate: this.parseDate(row.effectiveDate),
          },
        });
      }
    });
  }

  private contactData(contact: ReturnType<ProfileSnapshotService['serializeProfile']>['contact']) {
    return {
      primaryAddressLine1: contact.primaryAddressLine1,
      primaryAddressLine2: contact.primaryAddressLine2,
      primaryCity: contact.primaryCity,
      primaryState: contact.primaryState,
      primaryPostalCode: contact.primaryPostalCode,
      primaryCountry: contact.primaryCountry,
      mailingAddressLine1: contact.mailingAddressLine1,
      mailingAddressLine2: contact.mailingAddressLine2,
      mailingCity: contact.mailingCity,
      mailingState: contact.mailingState,
      mailingPostalCode: contact.mailingPostalCode,
      mailingCountry: contact.mailingCountry,
      phonePrimary: contact.phonePrimary,
      phoneSecondary: contact.phoneSecondary,
      emailPrimary: contact.emailPrimary,
      emailSecondary: contact.emailSecondary,
      signalAccount: contact.signalAccount,
    };
  }

  private workerData(worker: ReturnType<ProfileSnapshotService['serializeProfile']>['worker']) {
    return {
      workerType: worker.workerType ?? undefined,
      workerStatus: worker.workerStatus ?? undefined,
      internStartDate: this.parseDate(worker.internStartDate),
      ministryJoinDate: this.parseDate(worker.ministryJoinDate),
      workerJoinDate: this.parseDate(worker.workerJoinDate),
      terminationDate: this.parseDate(worker.terminationDate),
      sendingRegion: worker.sendingRegion,
      salarySource: worker.salarySource,
    };
  }

  private parseDate(value: string | null | undefined): Date | null {
    return value ? new Date(value) : null;
  }

  /** Phase 3 — Personal, Contact, and Passport always require approval for Staff. */
  private payloadRequiresApproval(payload: UpdateProfileDto): boolean {
    if (payload.basic && PROFILE_SECTION_DOMAIN.basic) {
      return true;
    }
    if (payload.contact && PROFILE_SECTION_DOMAIN.contact) {
      return true;
    }
    if (payload.passports && PROFILE_SECTION_DOMAIN.passport) {
      return true;
    }
    return false;
  }
}
