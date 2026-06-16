import { Module } from '@nestjs/common';
import { EmployeesModule } from '../employees/employees.module';
import { FamilyModule } from '../family/family.module';
import { ProfileModule } from '../profile/profile.module';
import { ApprovalChangeService } from './approval-change.service';
import { ApprovalScopeService } from './approval-scope.service';
import { ApprovalController } from './approval.controller';
import { ApprovalService } from './approval.service';

@Module({
  imports: [EmployeesModule, ProfileModule, FamilyModule],
  controllers: [ApprovalController],
  providers: [ApprovalService, ApprovalScopeService, ApprovalChangeService],
  exports: [ApprovalService],
})
export class ApprovalModule {}
