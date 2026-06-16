import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Gender, LanguageProficiency, MaritalStatus, WorkerStatus, WorkerType } from '@prisma/client';

export class UpdateBasicInfoDto {
  @IsOptional() @IsString() @MaxLength(100) firstName?: string;
  @IsOptional() @IsString() @MaxLength(100) lastName?: string;
  @IsOptional() @IsString() @MaxLength(100) preferredName?: string;
  @IsOptional() @IsDateString() dateOfBirth?: string;
  @IsOptional() @IsEnum(Gender) gender?: Gender;
  @IsOptional() @IsEnum(MaritalStatus) maritalStatus?: MaritalStatus;
  @IsOptional() @IsString() @MaxLength(80) citizenship?: string;
  @IsOptional() @IsString() @MaxLength(30) rcNumber?: string;
}

export class UpdateContactInfoDto {
  @IsOptional() @IsString() @MaxLength(200) primaryAddressLine1?: string;
  @IsOptional() @IsString() @MaxLength(200) primaryAddressLine2?: string;
  @IsOptional() @IsString() @MaxLength(100) primaryCity?: string;
  @IsOptional() @IsString() @MaxLength(80) primaryState?: string;
  @IsOptional() @IsString() @MaxLength(20) primaryPostalCode?: string;
  @IsOptional() @IsString() @MaxLength(80) primaryCountry?: string;
  @IsOptional() @IsString() @MaxLength(200) mailingAddressLine1?: string;
  @IsOptional() @IsString() @MaxLength(200) mailingAddressLine2?: string;
  @IsOptional() @IsString() @MaxLength(100) mailingCity?: string;
  @IsOptional() @IsString() @MaxLength(80) mailingState?: string;
  @IsOptional() @IsString() @MaxLength(20) mailingPostalCode?: string;
  @IsOptional() @IsString() @MaxLength(80) mailingCountry?: string;
  @IsOptional() @IsString() @MaxLength(30) phonePrimary?: string;
  @IsOptional() @IsString() @MaxLength(30) phoneSecondary?: string;
  @IsOptional() @IsString() @MaxLength(255) emailPrimary?: string;
  @IsOptional() @IsString() @MaxLength(255) emailSecondary?: string;
  @IsOptional() @IsString() @MaxLength(120) signalAccount?: string;
}

export class UpdateWorkerInfoDto {
  @IsOptional() @IsEnum(WorkerType) workerType?: WorkerType;
  @IsOptional() @IsEnum(WorkerStatus) workerStatus?: WorkerStatus;
  @IsOptional() @IsDateString() internStartDate?: string;
  @IsOptional() @IsDateString() ministryJoinDate?: string;
  @IsOptional() @IsDateString() workerJoinDate?: string;
  @IsOptional() @IsDateString() terminationDate?: string;
  @IsOptional() @IsString() @MaxLength(120) sendingRegion?: string;
  @IsOptional() @IsString() @MaxLength(120) salarySource?: string;
}

export class TeamAssignmentItemDto {
  @IsOptional() @IsString() id?: string;
  @IsString() @MaxLength(120) team!: string;
  @IsString() @MaxLength(120) position!: string;
  @IsDateString() startDate!: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsBoolean() isPrimary?: boolean;
}

export class EducationItemDto {
  @IsOptional() @IsString() id?: string;
  @IsString() @MaxLength(120) degree!: string;
  @IsOptional() @IsString() @MaxLength(120) major?: string;
  @IsString() @MaxLength(200) school!: string;
  @IsOptional() @IsInt() graduationYear?: number;
  @IsOptional() @IsString() notes?: string;
}

export class LanguageItemDto {
  @IsOptional() @IsString() id?: string;
  @IsString() @MaxLength(80) language!: string;
  @IsEnum(LanguageProficiency) proficiency!: LanguageProficiency;
}

export class PassportItemDto {
  @IsOptional() @IsString() id?: string;
  @IsString() @MaxLength(50) passportNumber!: string;
  @IsString() @MaxLength(80) country!: string;
  @IsOptional() @IsDateString() issueDate?: string;
  @IsOptional() @IsDateString() expiryDate?: string;
}

export class InsuranceItemDto {
  @IsOptional() @IsString() id?: string;
  @IsString() @MaxLength(120) insuranceProvider!: string;
  @IsString() @MaxLength(80) policyNumber!: string;
  @IsOptional() @IsDateString() effectiveDate?: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateBasicInfoDto)
  basic?: UpdateBasicInfoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateContactInfoDto)
  contact?: UpdateContactInfoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateWorkerInfoDto)
  worker?: UpdateWorkerInfoDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TeamAssignmentItemDto)
  teamAssignments?: TeamAssignmentItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationItemDto)
  education?: EducationItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LanguageItemDto)
  languages?: LanguageItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PassportItemDto)
  passports?: PassportItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InsuranceItemDto)
  insurance?: InsuranceItemDto[];
}
