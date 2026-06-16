import { Type } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import {
  REPORT_FILTER_FIELDS,
  REPORT_FILTER_OPERATORS,
  ReportFilterField,
  ReportFilterOperator,
} from '../report-filter.constants';

export class ReportFilterDto {
  @IsIn(REPORT_FILTER_FIELDS)
  field!: ReportFilterField;

  @IsOptional()
  @IsIn(REPORT_FILTER_OPERATORS)
  operator?: ReportFilterOperator;

  @IsNotEmpty()
  value!: string | number | boolean;
}
