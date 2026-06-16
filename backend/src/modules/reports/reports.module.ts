import { Module } from '@nestjs/common';
import { ReportFilterEngine } from './report-filter.engine';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, ReportFilterEngine],
  exports: [ReportsService, ReportFilterEngine],
})
export class ReportsModule {}
