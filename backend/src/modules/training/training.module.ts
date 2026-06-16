import { Module } from '@nestjs/common';
import { EmployeesModule } from '../employees/employees.module';
import { EmployeeTrainingController } from './employee-training.controller';
import { TrainingController } from './training.controller';
import { TrainingService } from './training.service';

@Module({
  imports: [EmployeesModule],
  controllers: [TrainingController, EmployeeTrainingController],
  providers: [TrainingService],
  exports: [TrainingService],
})
export class TrainingModule {}
