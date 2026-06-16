import { Controller, Get, Query } from '@nestjs/common';
import { RoleCode } from '@prisma/client';
import { PERMISSIONS } from '../../common/constants/permissions';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { RequireScope } from '../../common/decorators/scope.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuditService } from './audit.service';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  @Roles(RoleCode.ADMIN)
  @RequireScope('ALL')
  @RequirePermissions(PERMISSIONS.userView)
  listLogs(@Query() query: ListAuditLogsQueryDto) {
    return this.auditService.listLogs(query);
  }

  @Get('logs/filters')
  @Roles(RoleCode.ADMIN)
  @RequireScope('ALL')
  @RequirePermissions(PERMISSIONS.userView)
  listFilterOptions() {
    return this.auditService.listFilterOptions();
  }
}
