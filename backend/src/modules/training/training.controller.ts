import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';
import { PERMISSIONS } from '../../common/constants/permissions';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { TrainingService } from './training.service';

@Controller('trainings')
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.employeeView)
  listTrainings() {
    return this.trainingService.listTrainings();
  }
}
