import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FamilyRelationship, MaritalStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MarriageMergeService {
  constructor(private readonly prisma: PrismaService) {}

  async applyMarriageMerge(
    requesterEmployeeId: string,
    spouseEmployeeId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx ?? this.prisma;
    const run = async (db: Prisma.TransactionClient) => {
      const [requester, spouse] = await Promise.all([
        db.employee.findFirst({
          where: { id: requesterEmployeeId, deletedAt: null },
        }),
        db.employee.findFirst({
          where: { id: spouseEmployeeId, deletedAt: null },
        }),
      ]);

      if (!requester || !spouse) {
        throw new NotFoundException('Requester or spouse employee not found');
      }

      const requesterFamily = await this.findWorkerFamily(
        db,
        requesterEmployeeId,
      );
      const spouseFamily = await this.findWorkerFamily(db, spouseEmployeeId);

      if (!requesterFamily || !spouseFamily) {
        throw new BadRequestException(
          'Both employees must have an active family account before marriage merge',
        );
      }

      if (requesterFamily.id === spouseFamily.id) {
        throw new BadRequestException('Employees already share a family account');
      }

      const spouseDependents = spouseFamily.members.filter(
        (member) => member.relationshipType !== FamilyRelationship.WORKER,
      );
      const now = new Date();

      await db.familyMember.updateMany({
        where: { familyId: spouseFamily.id, deletedAt: null },
        data: { deletedAt: now, employeeId: null },
      });
      await db.family.update({
        where: { id: spouseFamily.id },
        data: { deletedAt: now },
      });

      await db.familyMember.updateMany({
        where: {
          familyId: requesterFamily.id,
          deletedAt: null,
          relationshipType: FamilyRelationship.SPOUSE,
          employeeId: null,
        },
        data: { deletedAt: now },
      });

      const existingSpouseMember = await db.familyMember.findFirst({
        where: {
          familyId: requesterFamily.id,
          employeeId: spouseEmployeeId,
          deletedAt: null,
        },
      });

      if (!existingSpouseMember) {
        await db.familyMember.create({
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
        await db.familyMember.create({
          data: {
            familyId: requesterFamily.id,
            relationshipType: dependent.relationshipType,
            firstName: dependent.firstName,
            lastName: dependent.lastName,
            dateOfBirth: dependent.dateOfBirth,
          },
        });
      }

      await db.family.update({
        where: { id: requesterFamily.id },
        data: {
          displayName: `${requester.lastName} & ${spouse.lastName} Family`,
        },
      });

      await db.employee.updateMany({
        where: { id: { in: [requesterEmployeeId, spouseEmployeeId] } },
        data: { maritalStatus: MaritalStatus.MARRIED },
      });
    };

    if (tx) {
      await run(tx);
      return;
    }

    await this.prisma.$transaction(run);
  }

  private async findWorkerFamily(
    db: Prisma.TransactionClient,
    employeeId: string,
  ) {
    return db.family.findFirst({
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
        members: {
          where: { deletedAt: null },
        },
      },
    });
  }
}
