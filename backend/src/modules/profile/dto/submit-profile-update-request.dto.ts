import { Type } from 'class-transformer';
import { IsOptional, IsString, IsUUID, MaxLength, ValidateNested } from 'class-validator';
import { UpdateProfileDto } from './update-profile.dto';

export class SubmitProfileUpdateRequestDto {
  @IsUUID()
  targetEmployeeId!: string;

  @ValidateNested()
  @Type(() => UpdateProfileDto)
  profile!: UpdateProfileDto;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}
