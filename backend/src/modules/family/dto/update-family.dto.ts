import { FamilyRelationship } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class FamilyMemberUpdateDto {
  @IsOptional() @IsString() id?: string;
  @IsEnum(FamilyRelationship) relationshipType!: FamilyRelationship;
  @IsString() @MaxLength(100) firstName!: string;
  @IsString() @MaxLength(100) lastName!: string;
  @IsOptional() @IsDateString() dateOfBirth?: string;
}

export class UpdateFamilyDto {
  @IsString() @MaxLength(120) displayName!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FamilyMemberUpdateDto)
  members!: FamilyMemberUpdateDto[];
}
