import { Controller, Get, Param, Req } from '@nestjs/common';
import { Request } from 'express';
import { PERMISSIONS } from '../../common/constants/permissions';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { TrainingService } from './training.service';

@Controller('employees')
export class EmployeeTrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  @Get('me/trainings')
  @RequirePermissions(PERMISSIONS.employeeView)
  getMyTrainings(@Req() request: Request) {
    return this.trainingService.getMyTrainings(request.user as AuthUser);
  }

  @Get(':id/trainings')
  @RequirePermissions(PERMISSIONS.employeeView)
  getEmployeeTrainings(@Param('id') id: string, @Req() request: Request) {
    return this.trainingService.getEmployeeTrainings(
      id,
      request.user as AuthUser,
    );
  }
}
