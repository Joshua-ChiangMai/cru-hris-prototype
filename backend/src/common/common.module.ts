import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditLogService } from './services/audit-log.service';
import { RbacService } from './services/rbac.service';
import { ProfileSnapshotService } from './services/profile-snapshot.service';
import { SensitiveFieldsService } from './services/sensitive-fields.service';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    AuditLogService,
    RbacService,
    SensitiveFieldsService,
    ProfileSnapshotService,
  ],
  exports: [
    AuditLogService,
    RbacService,
    SensitiveFieldsService,
    ProfileSnapshotService,
  ],
})
export class CommonModule {}
