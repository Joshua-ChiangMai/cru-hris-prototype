import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { EmployeeScopeService } from '../employees/employee-scope.service';

@Injectable()
export class TrainingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scopeService: EmployeeScopeService,
  ) {}

  async listTrainings() {
    const trainings = await this.prisma.training.findMany({
      orderBy: [{ category: 'asc' }, { title: 'asc' }],
    });

    return {
      data: trainings.map((training) => this.serializeTraining(training)),
    };
  }

  async getMyTrainings(authUser: AuthUser) {
    const employee = await this.prisma.employee.findFirst({
      where: { userId: authUser.userId, deletedAt: null },
      select: { id: true },
    });

    if (!employee) {
      throw new NotFoundException('Employee profile not linked to this user');
    }

    return this.getEmployeeTrainings(employee.id, authUser);
  }

  async getEmployeeTrainings(employeeId: string, authUser: AuthUser) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, deletedAt: null },
      select: { id: true, userId: true, cityId: true },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    await this.scopeService.assertCanAccessEmployee(authUser, employee);

    const assignments = await this.prisma.employeeTraining.findMany({
      where: { employeeId },
      include: { training: true },
      orderBy: [
        { training: { title: 'asc' } },
        { completionDate: 'desc' },
      ],
    });

    return {
      data: assignments.map((assignment) =>
        this.serializeEmployeeTraining(assignment),
      ),
    };
  }

  private serializeTraining(training: {
    id: string;
    code: string;
    title: string;
    category: string;
    provider: string;
    startDate: Date | null;
    endDate: Date | null;
  }) {
    return {
      id: training.id,
      code: training.code,
      title: training.title,
      category: training.category,
      provider: training.provider,
      startDate: training.startDate?.toISOString().slice(0, 10) ?? null,
      endDate: training.endDate?.toISOString().slice(0, 10) ?? null,
    };
  }

  private serializeEmployeeTraining(assignment: {
    id: string;
    employeeId: string;
    trainingId: string;
    completionDate: Date | null;
    status: string;
    training: {
      id: string;
      code: string;
      title: string;
      category: string;
      provider: string;
      startDate: Date | null;
      endDate: Date | null;
    };
  }) {
    return {
      id: assignment.id,
      employeeId: assignment.employeeId,
      trainingId: assignment.trainingId,
      completionDate:
        assignment.completionDate?.toISOString().slice(0, 10) ?? null,
      status: assignment.status,
      training: this.serializeTraining(assignment.training),
    };
  }
}
