import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import {
  EMPLOYMENT_STATUS_VALUES,
  type EmploymentStatusValue,
} from '../../../common/constants/employment-status';

export class EmployeeReportQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  cityId?: string;

  @IsOptional()
  @IsEnum(EMPLOYMENT_STATUS_VALUES)
  employmentStatus?: EmploymentStatusValue;

  @IsOptional()
  @IsString()
  department?: string;
}
