import { Module } from '@nestjs/common';
import { EmployeesModule } from '../employees/employees.module';
import { MarriageController } from './marriage.controller';
import { MarriageMergeService } from './marriage-merge.service';
import { MarriageService } from './marriage.service';

@Module({
  imports: [EmployeesModule],
  controllers: [MarriageController],
  providers: [MarriageService, MarriageMergeService],
  exports: [MarriageService, MarriageMergeService],
})
export class MarriageModule {}
