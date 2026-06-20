/**
 * HRIS P1 Prototype — Enterprise demo seed
 *
 * Run (from repo root):
 *   npm run prisma:migrate    # or: cd backend && npx prisma migrate deploy
 *   npm run prisma:generate
 *   npm run prisma:seed
 *
 * Reset database (destructive):
 *   cd backend && npx prisma migrate reset
 *
 * All demo passwords: Password123!
 */
import {
  ApprovalAction,
  AuditAction,
  AuditEntity,
  DataScopeType,
  FamilyRelationship,
  MaritalStatus,
  MarriageRequestStatus,
  Prisma,
  PrismaClient,
  RoleCode,
  UpdateRequestStatus,
} from '@prisma/client';
import { hash } from 'bcryptjs';
import {
  pickAssignmentStatus,
  pickCompletionDate,
  shouldAssignTraining,
  TRAINING_SEEDS,
} from './training-seed-data';
import {
  ALL_EMPLOYEES,
  APPROVAL_SCENARIOS,
  ApprovalScenario,
  CITY_SEEDS,
  DEMO_PASSWORD,
  EmployeeSeed,
  FAMILY_SEEDS,
  USER_SEEDS,
} from './seed-data';
import { PROFILE_SEEDS } from './profile-seed-data';
import {
  MARRIAGE_APPROVED_SEEDS,
  MARRIAGE_REQUEST_SEEDS,
} from './marriage-seed-data';

const prisma = new PrismaClient();

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function employeeSnapshot(
  employee: {
    employeeNo: string;
    firstName: string;
    lastName: string;
    workEmail: string | null;
    phone: string | null;
    jobTitle: string | null;
    department: string | null;
    employmentStatus: string;
    cityId: string;
    hireDate: Date | null;
    managerEmployeeId: string | null;
  },
  extras?: Record<string, unknown>,
): Record<string, unknown> {
  return {
    employeeNo: employee.employeeNo,
    firstName: employee.firstName,
    lastName: employee.lastName,
    workEmail: employee.workEmail,
    phone: employee.phone,
    jobTitle: employee.jobTitle,
    department: employee.department,
    employmentStatus: employee.employmentStatus,
    cityId: employee.cityId,
    hireDate: employee.hireDate?.toISOString().slice(0, 10) ?? null,
    managerEmployeeId: employee.managerEmployeeId,
    addressLine1: extras?.addressLine1 ?? null,
    addressCity: extras?.addressCity ?? null,
    passportNumber: extras?.passportNumber ?? null,
    passportExpiry: extras?.passportExpiry ?? null,
  };
}

function applyScenarioChange(
  before: Record<string, unknown>,
  scenario: ApprovalScenario['scenario'],
): Record<string, unknown> {
  const after = { ...before };

  switch (scenario) {
    case 'phone':
      after.phone = '+62 812 5555 0199';
      after.changeSummary = 'Mobile phone number update';
      break;
    case 'address':
      after.addressLine1 = '88 Orchard Road, #12-08';
      after.addressCity = 'Singapore';
      after.changeSummary = 'Residential address update';
      break;
    case 'passport':
      after.passportNumber = 'P1234567A';
      after.passportExpiry = '2031-06-30';
      after.changeSummary = 'Passport details update';
      break;
    case 'workEmail':
      after.workEmail = String(before.workEmail).replace(
        '@hris.local',
        '.new@hris.local',
      );
      after.changeSummary = 'Work email update';
      break;
    default:
      break;
  }

  return after;
}

async function resetDemoData(): Promise<void> {
  await prisma.auditLog.deleteMany();
  await prisma.approvalLog.deleteMany();
  await prisma.updateRequest.deleteMany();
  await prisma.employeeTraining.deleteMany();
  await prisma.training.deleteMany();
  await prisma.employeeInsurance.deleteMany();
  await prisma.employeePassport.deleteMany();
  await prisma.employeeLanguageSkill.deleteMany();
  await prisma.employeeEducation.deleteMany();
  await prisma.employeeTeamAssignment.deleteMany();
  await prisma.employeeWorkerInfo.deleteMany();
  await prisma.employeeContactInfo.deleteMany();
  await prisma.employeeBasicInfo.deleteMany();
  await prisma.marriageRequest.deleteMany();
  await prisma.familyMember.deleteMany();
  await prisma.family.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.user.deleteMany({
    where: { email: { endsWith: '@hris.local' } },
  });
}

async function seedCities() {
  const cities: Record<string, { id: string }> = {};

  for (const city of CITY_SEEDS) {
    const row = await prisma.city.upsert({
      where: { code: city.code },
      update: { name: city.name, countryCode: city.countryCode, isActive: true },
      create: city,
    });
    cities[city.code] = row;
  }

  return cities;
}

async function seedRoles() {
  const roles = await Promise.all(
    ([RoleCode.STAFF, RoleCode.HR, RoleCode.ADMIN] as const).map((code) =>
      prisma.role.upsert({
        where: { code },
        update: {},
        create: {
          code,
          name: code.charAt(0) + code.slice(1).toLowerCase(),
          isSystem: true,
        },
      }),
    ),
  );

  return Object.fromEntries(roles.map((role) => [role.code, role]));
}

async function seedUsers(
  passwordHash: string,
  roleByCode: Record<string, { id: string }>,
  cities: Record<string, { id: string }>,
) {
  const users: Record<string, { id: string; email: string }> = {};

  for (const seed of USER_SEEDS) {
    const user = await prisma.user.upsert({
      where: { email: seed.email },
      update: { passwordHash, status: 'ACTIVE' },
      create: { email: seed.email, passwordHash, status: 'ACTIVE' },
    });
    users[seed.email] = user;
  }

  await prisma.userRole.deleteMany({
    where: { userId: { in: Object.values(users).map((u) => u.id) } },
  });

  const roleRows: Prisma.UserRoleCreateManyInput[] = [];

  for (const seed of USER_SEEDS) {
    const user = users[seed.email];
    const role = roleByCode[seed.role];

    if (seed.role === RoleCode.ADMIN) {
      roleRows.push({
        userId: user.id,
        roleId: role.id,
        scopeType: DataScopeType.GLOBAL,
      });
      continue;
    }

    if (seed.role === RoleCode.HR && seed.cityCodes?.length) {
      for (const code of seed.cityCodes) {
        roleRows.push({
          userId: user.id,
          roleId: role.id,
          scopeType: DataScopeType.CITY,
          cityId: cities[code].id,
        });
      }
      continue;
    }

    roleRows.push({
      userId: user.id,
      roleId: role.id,
      scopeType: DataScopeType.GLOBAL,
    });
  }

  await prisma.userRole.createMany({ data: roleRows });

  return users;
}

async function seedEmployees(
  cities: Record<string, { id: string }>,
  users: Record<string, { id: string; email: string }>,
) {
  const employees: Record<string, { id: string; cityId: string }> = {};

  for (const seed of ALL_EMPLOYEES) {
    const cityId = cities[seed.cityCode].id;
    const userId = seed.loginEmail ? users[seed.loginEmail]?.id : undefined;

    const employee = await prisma.employee.create({
      data: {
        employeeNo: seed.employeeNo,
        userId,
        cityId,
        firstName: seed.firstName,
        lastName: seed.lastName,
        workEmail: seed.workEmail,
        phone: seed.phone,
        jobTitle: seed.jobTitle,
        department: seed.department,
        gender: seed.gender,
        maritalStatus: seed.maritalStatus,
        employmentStatus: seed.employmentStatus,
        hireDate: new Date(seed.hireDate),
      },
    });

    employees[seed.employeeNo] = { id: employee.id, cityId };
  }

  for (const seed of ALL_EMPLOYEES) {
    if (!seed.managerEmployeeNo) {
      continue;
    }

    const employee = employees[seed.employeeNo];
    const manager = employees[seed.managerEmployeeNo];

    if (employee && manager) {
      await prisma.employee.update({
        where: { id: employee.id },
        data: { managerEmployeeId: manager.id },
      });
    }
  }

  return employees;
}

async function seedProfiles(
  employees: Record<string, { id: string; cityId: string }>,
) {
  for (const seed of PROFILE_SEEDS) {
    const ref = employees[seed.employeeNo];
    if (!ref) continue;

    const employee = await prisma.employee.findUnique({ where: { id: ref.id } });
    if (!employee) continue;

    if (seed.basic) {
      await prisma.employeeBasicInfo.upsert({
        where: { employeeId: employee.id },
        create: {
          employeeId: employee.id,
          preferredName: seed.basic.preferredName,
          dateOfBirth: seed.basic.dateOfBirth
            ? new Date(seed.basic.dateOfBirth)
            : null,
          citizenship: seed.basic.citizenship,
          rcNumber: seed.basic.rcNumber,
        },
        update: {
          preferredName: seed.basic.preferredName,
          dateOfBirth: seed.basic.dateOfBirth
            ? new Date(seed.basic.dateOfBirth)
            : null,
          citizenship: seed.basic.citizenship,
          rcNumber: seed.basic.rcNumber,
        },
      });
    }

    if (seed.contact) {
      await prisma.employeeContactInfo.upsert({
        where: { employeeId: employee.id },
        create: {
          employeeId: employee.id,
          primaryAddressLine1: seed.contact.primaryAddressLine1,
          primaryCity: seed.contact.primaryCity,
          primaryCountry: seed.contact.primaryCountry,
          phonePrimary: employee.phone,
          phoneSecondary: seed.contact.phoneSecondary,
          emailPrimary: employee.workEmail,
          emailSecondary: seed.contact.emailSecondary,
          signalAccount: seed.contact.signalAccount,
        },
        update: {
          primaryAddressLine1: seed.contact.primaryAddressLine1,
          primaryCity: seed.contact.primaryCity,
          primaryCountry: seed.contact.primaryCountry,
          phoneSecondary: seed.contact.phoneSecondary,
          emailSecondary: seed.contact.emailSecondary,
          signalAccount: seed.contact.signalAccount,
        },
      });
    }

    if (seed.worker) {
      await prisma.employeeWorkerInfo.upsert({
        where: { employeeId: employee.id },
        create: {
          employeeId: employee.id,
          workerType: seed.worker.workerType,
          workerStatus: seed.worker.workerStatus,
          ministryJoinDate: seed.worker.ministryJoinDate
            ? new Date(seed.worker.ministryJoinDate)
            : null,
          workerJoinDate: seed.worker.workerJoinDate
            ? new Date(seed.worker.workerJoinDate)
            : null,
          sendingRegion: seed.worker.sendingRegion,
          salarySource: seed.worker.salarySource,
        },
        update: {
          workerType: seed.worker.workerType,
          workerStatus: seed.worker.workerStatus,
          ministryJoinDate: seed.worker.ministryJoinDate
            ? new Date(seed.worker.ministryJoinDate)
            : null,
          workerJoinDate: seed.worker.workerJoinDate
            ? new Date(seed.worker.workerJoinDate)
            : null,
          sendingRegion: seed.worker.sendingRegion,
          salarySource: seed.worker.salarySource,
        },
      });
    }

    if (seed.teamAssignments) {
      for (const row of seed.teamAssignments) {
        await prisma.employeeTeamAssignment.create({
          data: {
            employeeId: employee.id,
            team: row.team,
            position: row.position,
            startDate: new Date(row.startDate),
            endDate: row.endDate ? new Date(row.endDate) : null,
            isPrimary: row.isPrimary ?? false,
          },
        });
      }
    }

    if (seed.education) {
      for (const row of seed.education) {
        await prisma.employeeEducation.create({
          data: {
            employeeId: employee.id,
            degree: row.degree,
            major: row.major,
            school: row.school,
            graduationYear: row.graduationYear,
          },
        });
      }
    }

    if (seed.languages) {
      for (const row of seed.languages) {
        await prisma.employeeLanguageSkill.create({
          data: {
            employeeId: employee.id,
            language: row.language,
            proficiency: row.proficiency,
          },
        });
      }
    }

    if (seed.passports) {
      for (const row of seed.passports) {
        await prisma.employeePassport.create({
          data: {
            employeeId: employee.id,
            passportNumber: row.passportNumber,
            country: row.country,
            issueDate: row.issueDate ? new Date(row.issueDate) : null,
            expiryDate: row.expiryDate ? new Date(row.expiryDate) : null,
          },
        });
      }
    }

    if (seed.insurance) {
      for (const row of seed.insurance) {
        await prisma.employeeInsurance.create({
          data: {
            employeeId: employee.id,
            insuranceProvider: row.insuranceProvider,
            policyNumber: row.policyNumber,
            effectiveDate: row.effectiveDate
              ? new Date(row.effectiveDate)
              : null,
          },
        });
      }
    }
  }
}

async function seedFamilies(
  employees: Record<string, { id: string; cityId: string }>,
) {
  for (const seed of FAMILY_SEEDS) {
    const workerRef = employees[seed.workerEmployeeNo];
    if (!workerRef) {
      throw new Error(`Missing worker employee for family ${seed.rcNumber}`);
    }

    const workerEmployee = await prisma.employee.findUnique({
      where: { id: workerRef.id },
    });

    if (!workerEmployee) {
      throw new Error(`Missing worker row for family ${seed.rcNumber}`);
    }

    const family = await prisma.family.create({
      data: {
        rcNumber: seed.rcNumber,
        displayName: seed.displayName,
      },
    });

    await prisma.familyMember.create({
      data: {
        familyId: family.id,
        employeeId: workerEmployee.id,
        relationshipType: FamilyRelationship.WORKER,
        firstName: workerEmployee.firstName,
        lastName: workerEmployee.lastName,
        dateOfBirth: null,
      },
    });

    for (const dependent of seed.dependents) {
      const linkedEmployeeId = dependent.employeeNo
        ? employees[dependent.employeeNo]?.id
        : undefined;

      await prisma.familyMember.create({
        data: {
          familyId: family.id,
          employeeId: linkedEmployeeId,
          relationshipType: dependent.relationshipType,
          firstName: dependent.firstName,
          lastName: dependent.lastName,
          dateOfBirth: dependent.dateOfBirth
            ? new Date(dependent.dateOfBirth)
            : null,
        },
      });
    }
  }
}

function resolveRequesterUserId(
  requester: { userId: string | null },
  requesterEmployeeNo: string,
  users: Record<string, { id: string; email: string }>,
): string {
  if (requester.userId) {
    return requester.userId;
  }

  const loginEmail = ALL_EMPLOYEES.find(
    (e) => e.employeeNo === requesterEmployeeNo,
  )?.loginEmail;

  if (loginEmail && users[loginEmail]) {
    return users[loginEmail].id;
  }

  return users['admin@hris.local'].id;
}

async function seedApprovals(
  users: Record<string, { id: string; email: string }>,
  employees: Record<string, { id: string; cityId: string }>,
) {
  for (const scenario of APPROVAL_SCENARIOS) {
    const targetRef = employees[scenario.targetEmployeeNo];
    const requesterRef = employees[scenario.requesterEmployeeNo];

    if (!targetRef || !requesterRef) {
      throw new Error(
        `Missing employee for approval ${scenario.requestNo}`,
      );
    }

    const target = await prisma.employee.findUnique({
      where: { id: targetRef.id },
    });
    const requester = await prisma.employee.findUnique({
      where: { id: requesterRef.id },
    });

    if (!target || !requester) {
      throw new Error(
        `Missing employee row for approval ${scenario.requestNo}`,
      );
    }

    const approver = users[scenario.approverEmail];
    const requesterUserId = resolveRequesterUserId(
      requester,
      scenario.requesterEmployeeNo,
      users,
    );
    const submittedAt = daysAgo(scenario.submittedDaysAgo);
    const resolvedAt = scenario.resolvedDaysAgo
      ? daysAgo(scenario.resolvedDaysAgo)
      : null;

    const before = employeeSnapshot(target, {
      addressLine1: 'Existing address on file',
      addressCity: 'Jakarta',
      passportNumber: 'X0000000',
      passportExpiry: '2028-12-31',
    });
    const after = applyScenarioChange(before, scenario.scenario);

    const request = await prisma.updateRequest.create({
      data: {
        requestNo: scenario.requestNo,
        requestType: scenario.requestType,
        requesterEmployeeId: requester.id,
        targetEmployeeId: target.id,
        assignedApproverUserId: approver?.id,
        cityId: target.cityId,
        status: scenario.status,
        version: scenario.status === UpdateRequestStatus.PENDING ? 0 : 1,
        payloadBefore: before as Prisma.InputJsonValue,
        payloadAfter: after as Prisma.InputJsonValue,
        rejectionReason: scenario.rejectionReason,
        submittedAt,
        resolvedAt,
      },
    });

    await prisma.approvalLog.create({
      data: {
        updateRequestId: request.id,
        actorUserId: requesterUserId,
        action: ApprovalAction.SUBMIT,
        fromStatus: null,
        toStatus: UpdateRequestStatus.PENDING,
        comment: `Submitted ${scenario.scenario} change request`,
        createdAt: submittedAt,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: requesterUserId,
        action: AuditAction.SUBMIT,
        entity: AuditEntity.UPDATE_REQUEST,
        entityId: request.id,
        entityLabel: scenario.requestNo,
        beforeValue: before as Prisma.InputJsonValue,
        afterValue: after as Prisma.InputJsonValue,
        createdAt: submittedAt,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: requesterUserId,
        action: AuditAction.SUBMIT,
        entity: AuditEntity.EMPLOYEE_PROFILE,
        entityId: target.id,
        entityLabel: target.employeeNo,
        beforeValue: before as Prisma.InputJsonValue,
        afterValue: after as Prisma.InputJsonValue,
        createdAt: submittedAt,
      },
    });

    if (scenario.status === UpdateRequestStatus.APPROVED && approver) {
      const approvedAt = resolvedAt ?? submittedAt;

      await prisma.approvalLog.create({
        data: {
          updateRequestId: request.id,
          actorUserId: approver.id,
          action: ApprovalAction.APPROVE,
          fromStatus: UpdateRequestStatus.PENDING,
          toStatus: UpdateRequestStatus.APPROVED,
          comment: 'Approved for enterprise demo',
          createdAt: approvedAt,
        },
      });

      await prisma.auditLog.create({
        data: {
          actorUserId: approver.id,
          action: AuditAction.APPROVE,
          entity: AuditEntity.UPDATE_REQUEST,
          entityId: request.id,
          entityLabel: scenario.requestNo,
          beforeValue: {
            status: UpdateRequestStatus.PENDING,
            payload: before,
          } as Prisma.InputJsonValue,
          afterValue: {
            status: UpdateRequestStatus.APPROVED,
            payload: after,
          } as Prisma.InputJsonValue,
          createdAt: approvedAt,
        },
      });

      await prisma.auditLog.create({
        data: {
          actorUserId: approver.id,
          action: AuditAction.UPDATE,
          entity: AuditEntity.EMPLOYEE_PROFILE,
          entityId: target.id,
          entityLabel: target.employeeNo,
          beforeValue: before as Prisma.InputJsonValue,
          afterValue: after as Prisma.InputJsonValue,
          createdAt: approvedAt,
        },
      });

      await prisma.employee.update({
        where: { id: target.id },
        data: {
          phone: after.phone ? String(after.phone) : target.phone,
          workEmail: after.workEmail ? String(after.workEmail) : target.workEmail,
        },
      });

      if (after.phone !== undefined) {
        const phonePrimary = after.phone ? String(after.phone) : null;
        await prisma.employeeContactInfo.upsert({
          where: { employeeId: target.id },
          create: { employeeId: target.id, phonePrimary },
          update: { phonePrimary },
        });
      }

      if (after.workEmail !== undefined) {
        const emailPrimary = after.workEmail ? String(after.workEmail) : null;
        await prisma.employeeContactInfo.upsert({
          where: { employeeId: target.id },
          create: { employeeId: target.id, emailPrimary },
          update: { emailPrimary },
        });
      }
    }

    if (scenario.status === UpdateRequestStatus.REJECTED && approver) {
      const rejectedAt = resolvedAt ?? submittedAt;

      await prisma.approvalLog.create({
        data: {
          updateRequestId: request.id,
          actorUserId: approver.id,
          action: ApprovalAction.REJECT,
          fromStatus: UpdateRequestStatus.PENDING,
          toStatus: UpdateRequestStatus.REJECTED,
          comment: scenario.rejectionReason ?? 'Rejected',
          createdAt: rejectedAt,
        },
      });

      await prisma.auditLog.create({
        data: {
          actorUserId: approver.id,
          action: AuditAction.REJECT,
          entity: AuditEntity.UPDATE_REQUEST,
          entityId: request.id,
          entityLabel: scenario.requestNo,
          beforeValue: {
            status: UpdateRequestStatus.PENDING,
            payload: before,
          } as Prisma.InputJsonValue,
          afterValue: {
            status: UpdateRequestStatus.REJECTED,
            reason: scenario.rejectionReason ?? 'Rejected',
          } as Prisma.InputJsonValue,
          createdAt: rejectedAt,
        },
      });
    }

    if (scenario.status === UpdateRequestStatus.CANCELLED) {
      const cancelledAt = resolvedAt ?? submittedAt;

      await prisma.approvalLog.create({
        data: {
          updateRequestId: request.id,
          actorUserId: requesterUserId,
          action: ApprovalAction.CANCEL,
          fromStatus: UpdateRequestStatus.PENDING,
          toStatus: UpdateRequestStatus.CANCELLED,
          comment: 'Cancelled by requester',
          createdAt: cancelledAt,
        },
      });

      await prisma.auditLog.create({
        data: {
          actorUserId: requesterUserId,
          action: AuditAction.CANCEL,
          entity: AuditEntity.UPDATE_REQUEST,
          entityId: request.id,
          entityLabel: scenario.requestNo,
          beforeValue: {
            status: UpdateRequestStatus.PENDING,
            payload: before,
          } as Prisma.InputJsonValue,
          afterValue: {
            status: UpdateRequestStatus.CANCELLED,
          } as Prisma.InputJsonValue,
          createdAt: cancelledAt,
        },
      });
    }
  }
}

async function applyMarriageMergeForSeed(
  requesterEmployeeId: string,
  spouseEmployeeId: string,
) {
  await prisma.$transaction(async (tx) => {
    const [requester, spouse] = await Promise.all([
      tx.employee.findFirst({
        where: { id: requesterEmployeeId, deletedAt: null },
      }),
      tx.employee.findFirst({
        where: { id: spouseEmployeeId, deletedAt: null },
      }),
    ]);

    if (!requester || !spouse) {
      throw new Error('Marriage merge seed: employee not found');
    }

    const findWorkerFamily = async (employeeId: string) =>
      tx.family.findFirst({
        where: {
          deletedAt: null,
          members: {
            some: {
              employeeId,
              relationshipType: FamilyRelationship.WORKER,
              deletedAt: null,
            },
          },
        },
        include: {
          members: { where: { deletedAt: null } },
        },
      });

    const requesterFamily = await findWorkerFamily(requesterEmployeeId);
    const spouseFamily = await findWorkerFamily(spouseEmployeeId);

    if (!requesterFamily || !spouseFamily) {
      throw new Error('Marriage merge seed: missing family account');
    }

    const spouseDependents = spouseFamily.members.filter(
      (member) => member.relationshipType !== FamilyRelationship.WORKER,
    );
    const now = new Date();

    await tx.familyMember.updateMany({
      where: { familyId: spouseFamily.id, deletedAt: null },
      data: { deletedAt: now, employeeId: null },
    });
    await tx.family.update({
      where: { id: spouseFamily.id },
      data: { deletedAt: now },
    });

    await tx.familyMember.updateMany({
      where: {
        familyId: requesterFamily.id,
        deletedAt: null,
        relationshipType: FamilyRelationship.SPOUSE,
        employeeId: null,
      },
      data: { deletedAt: now },
    });

    const existingSpouseMember = await tx.familyMember.findFirst({
      where: {
        familyId: requesterFamily.id,
        employeeId: spouseEmployeeId,
        deletedAt: null,
      },
    });

    if (!existingSpouseMember) {
      await tx.familyMember.create({
        data: {
          familyId: requesterFamily.id,
          employeeId: spouseEmployeeId,
          relationshipType: FamilyRelationship.SPOUSE,
          firstName: spouse.firstName,
          lastName: spouse.lastName,
        },
      });
    }

    for (const dependent of spouseDependents) {
      await tx.familyMember.create({
        data: {
          familyId: requesterFamily.id,
          relationshipType: dependent.relationshipType,
          firstName: dependent.firstName,
          lastName: dependent.lastName,
          dateOfBirth: dependent.dateOfBirth,
        },
      });
    }

    await tx.family.update({
      where: { id: requesterFamily.id },
      data: {
        displayName: `${requester.lastName} & ${spouse.lastName} Family`,
      },
    });

    await tx.employee.updateMany({
      where: { id: { in: [requesterEmployeeId, spouseEmployeeId] } },
      data: { maritalStatus: MaritalStatus.MARRIED },
    });
  });
}

async function seedMarriageRequests(
  employees: Record<string, { id: string; cityId: string }>,
  users: Record<string, { id: string; email: string }>,
) {
  const hrReviewer = users['hr1@hris.local'];
  if (!hrReviewer) {
    throw new Error('Missing HR reviewer for marriage seed');
  }

  for (const seed of MARRIAGE_REQUEST_SEEDS) {
    const requester = employees[seed.requesterEmployeeNo];
    const spouse = employees[seed.spouseEmployeeNo];

    if (!requester || !spouse) {
      throw new Error(`Missing employees for marriage request ${seed.requestNo}`);
    }

    const submittedAt = daysAgo(seed.status === MarriageRequestStatus.PENDING ? 2 : 14);
    const resolvedAt =
      seed.status === MarriageRequestStatus.PENDING ? null : daysAgo(7);

    await prisma.marriageRequest.create({
      data: {
        requestNo: seed.requestNo,
        requesterEmployeeId: requester.id,
        spouseEmployeeId: spouse.id,
        cityId: requester.cityId,
        status: seed.status,
        submittedAt,
        approvedAt:
          seed.status === MarriageRequestStatus.APPROVED ? resolvedAt : null,
        rejectedAt:
          seed.status === MarriageRequestStatus.REJECTED ? resolvedAt : null,
        rejectionReason: seed.rejectionReason ?? null,
        reviewedByUserId:
          seed.status === MarriageRequestStatus.PENDING
            ? null
            : hrReviewer.id,
      },
    });
  }

  for (const seed of MARRIAGE_APPROVED_SEEDS) {
    const requester = employees[seed.requesterEmployeeNo];
    const spouse = employees[seed.spouseEmployeeNo];

    if (!requester || !spouse) {
      throw new Error(`Missing employees for approved marriage ${seed.requestNo}`);
    }

    const submittedAt = daysAgo(30);
    const approvedAt = daysAgo(21);

    await applyMarriageMergeForSeed(requester.id, spouse.id);

    await prisma.marriageRequest.create({
      data: {
        requestNo: seed.requestNo,
        requesterEmployeeId: requester.id,
        spouseEmployeeId: spouse.id,
        cityId: requester.cityId,
        status: MarriageRequestStatus.APPROVED,
        submittedAt,
        approvedAt,
        reviewedByUserId: hrReviewer.id,
      },
    });
  }
}

async function seedTrainings() {
  const trainings: Record<string, { id: string }> = {};

  for (const seed of TRAINING_SEEDS) {
    const row = await prisma.training.upsert({
      where: { code: seed.code },
      update: {
        title: seed.title,
        category: seed.category,
        provider: seed.provider,
        startDate: new Date(seed.startDate),
        endDate: new Date(seed.endDate),
      },
      create: {
        code: seed.code,
        title: seed.title,
        category: seed.category,
        provider: seed.provider,
        startDate: new Date(seed.startDate),
        endDate: new Date(seed.endDate),
      },
    });
    trainings[seed.code] = { id: row.id };
  }

  return trainings;
}

async function seedEmployeeTrainings(
  employees: Record<string, { id: string; cityId: string }>,
  trainings: Record<string, { id: string }>,
) {
  let assignmentCount = 0;

  for (const [employeeNo, employee] of Object.entries(employees)) {
    for (const seed of TRAINING_SEEDS) {
      if (!shouldAssignTraining(employeeNo, seed.code)) {
        continue;
      }

      const training = trainings[seed.code];
      if (!training) {
        continue;
      }

      const status = pickAssignmentStatus(employeeNo, seed.code);
      const completionDate = pickCompletionDate(status, employeeNo, seed.code);

      await prisma.employeeTraining.upsert({
        where: {
          employeeId_trainingId: {
            employeeId: employee.id,
            trainingId: training.id,
          },
        },
        update: {
          status,
          completionDate: completionDate ? new Date(completionDate) : null,
        },
        create: {
          employeeId: employee.id,
          trainingId: training.id,
          status,
          completionDate: completionDate ? new Date(completionDate) : null,
        },
      });

      assignmentCount += 1;
    }
  }

  return assignmentCount;
}

async function printSummary() {
  const [employees, families, pending, marriagePending, auditLogs, cities, users, trainings, assignments] =
    await Promise.all([
    prisma.employee.count({ where: { deletedAt: null } }),
    prisma.family.count({ where: { deletedAt: null } }),
    prisma.updateRequest.count({
      where: { status: UpdateRequestStatus.PENDING, deletedAt: null },
    }),
    prisma.marriageRequest.count({
      where: { status: MarriageRequestStatus.PENDING },
    }),
    prisma.auditLog.count(),
    prisma.city.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { email: { endsWith: '@hris.local' } } }),
    prisma.training.count(),
    prisma.employeeTraining.count(),
  ]);

  const byCity = await prisma.employee.groupBy({
    by: ['cityId'],
    where: { deletedAt: null },
    _count: { _all: true },
  });

  console.log('\n=== HRIS P1 Prototype demo seed complete ===\n');
  console.log(
    `Cities: ${cities} | Users: ${users} | Employees: ${employees} | Families: ${families}`,
  );
  console.log(`Training courses: ${trainings} | Employee assignments: ${assignments}`);
  console.log(`Pending approvals: ${pending} | Pending marriage requests: ${marriagePending} | Audit logs: ${auditLogs}`);
  console.log(`City headcount groups: ${byCity.length}`);
  console.log('\nDemo logins (password: Password123!):\n');
  console.log('  Admin:  admin@hris.local');
  console.log('  HR:     hr1@hris.local (Jakarta)');
  console.log('          hr2@hris.local (Bangkok)');
  console.log('          hr3@hris.local (Singapore + Chiang Mai)');
  console.log('  Staff:  staff1@hris.local … staff10@hris.local\n');
}

async function main(): Promise<void> {
  const passwordHash = await hash(DEMO_PASSWORD, 12);

  console.log('Resetting prior demo data…');
  await resetDemoData();

  console.log('Seeding cities, roles, users…');
  const cities = await seedCities();
  const roleByCode = await seedRoles();
  const users = await seedUsers(passwordHash, roleByCode, cities);

  console.log('Seeding employees…');
  const employees = await seedEmployees(cities, users);

  console.log('Seeding families…');
  await seedFamilies(employees);

  console.log('Seeding employee profiles…');
  await seedProfiles(employees);

  console.log('Seeding training catalog and assignments…');
  const trainings = await seedTrainings();
  await seedEmployeeTrainings(employees, trainings);

  console.log('Seeding approval workflows…');
  await seedApprovals(users, employees);

  console.log('Seeding marriage workflow…');
  await seedMarriageRequests(employees, users);

  await printSummary();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
