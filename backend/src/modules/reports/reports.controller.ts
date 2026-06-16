import {
  Body,
  Controller,
  Get,
  Header,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { PERMISSIONS } from '../../common/constants/permissions';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequireCityAccess } from '../../common/decorators/city-access.decorator';
import {
  RequireAnyPermission,
  RequirePermissions,
} from '../../common/decorators/permissions.decorator';
import { RequireScope } from '../../common/decorators/scope.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { EmployeeReportQueryDto } from './dto/employee-report-query.dto';
import { HeadcountQueryDto } from './dto/headcount-query.dto';
import { ReportExportDto } from './dto/report-export.dto';
import { ReportQueryDto } from './dto/report-query.dto';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('departments')
  @RequireScope('CITY', 'ALL')
  @RequirePermissions(PERMISSIONS.reportView)
  listDepartments(@CurrentUser() user: AuthUser) {
    return this.reportsService.listDepartments(user);
  }

  @Post('query')
  @RequireScope('CITY', 'ALL')
  @RequirePermissions(PERMISSIONS.reportView)
  queryReport(
    @Body() payload: ReportQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.reportsService.queryReport(payload, user);
  }

  @Post('query/export')
  @RequireScope('CITY', 'ALL')
  @RequirePermissions(PERMISSIONS.reportExport)
  async exportQueryReport(
    @Body() payload: ReportExportDto,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ): Promise<void> {
    const { filename, content, contentType } =
      await this.reportsService.exportQueryReport(payload, user);

    res.setHeader('Content-Type', contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    res.send(content);
  }

  @Get('dashboard')
  @RequireAnyPermission(
    PERMISSIONS.employeeView,
    PERMISSIONS.approvalView,
  )
  getDashboard(@CurrentUser() user: AuthUser) {
    return this.reportsService.getDashboard(user);
  }

  @Get('headcount')
  @RequireScope('CITY', 'ALL')
  @RequirePermissions(PERMISSIONS.reportView)
  @RequireCityAccess('cityId')
  getHeadcount(
    @Query() query: HeadcountQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.reportsService.getHeadcount(query, user);
  }

  @Get('statistics')
  @RequireScope('CITY', 'ALL')
  @RequirePermissions(PERMISSIONS.reportView)
  @RequireCityAccess('cityId')
  getStatistics(
    @Query() query: HeadcountQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.reportsService.getStatistics(query, user);
  }

  @Get('approval-summary')
  @RequireScope('CITY', 'ALL')
  @RequirePermissions(PERMISSIONS.reportView)
  getApprovalSummary(@CurrentUser() user: AuthUser) {
    return this.reportsService.getApprovalSummary(user);
  }

  @Get('employees')
  @RequireScope('CITY', 'ALL')
  @RequirePermissions(PERMISSIONS.reportView)
  @RequireCityAccess('cityId')
  listEmployees(
    @Query() query: EmployeeReportQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.reportsService.listEmployees(query, user);
  }

  @Get('employees/export')
  @RequireScope('CITY', 'ALL')
  @RequirePermissions(PERMISSIONS.reportExport)
  @RequireCityAccess('cityId')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportEmployees(
    @Query() query: EmployeeReportQueryDto,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ): Promise<void> {
    const { filename, content } = await this.reportsService.exportEmployeesCsv(
      query,
      user,
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    res.send(content);
  }
}
