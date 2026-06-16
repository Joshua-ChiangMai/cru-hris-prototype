import { IsIn } from 'class-validator';
import { ReportQueryDto } from './report-query.dto';

export class ReportExportDto extends ReportQueryDto {
  @IsIn(['csv', 'xlsx'])
  format!: 'csv' | 'xlsx';
}
