import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  EMPLOYMENT_STATUS_VALUES,
  type EmploymentStatusValue,
} from '../../../common/constants/employment-status';

export class CreateEmployeeDto {
  @IsString()
  @MaxLength(50)
  employeeNo!: string;

  @IsUUID()
  cityId!: string;

  @IsOptional()
  @IsUUID()
  managerEmployeeId?: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsOptional()
  @IsEmail()
  workEmail?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  jobTitle?: string;

  @IsOptional()
  @IsEnum(EMPLOYMENT_STATUS_VALUES)
  employmentStatus?: EmploymentStatusValue;

  @IsOptional()
  @IsDateString()
  hireDate?: string;
}
