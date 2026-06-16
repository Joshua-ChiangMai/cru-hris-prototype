import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { EmploymentStatus } from '@prisma/client';

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
  @IsEnum(EmploymentStatus)
  employmentStatus?: EmploymentStatus;

  @IsOptional()
  @IsDateString()
  hireDate?: string;
}
