import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import {
  FAMILY_RELATIONSHIP_VALUES,
  type FamilyRelationshipValue,
} from '../../../common/constants/family-relationship';

export class FamilyMemberUpdateDto {
  @IsOptional() @IsString() id?: string;
  @IsIn(FAMILY_RELATIONSHIP_VALUES)
  relationshipType!: FamilyRelationshipValue;
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
