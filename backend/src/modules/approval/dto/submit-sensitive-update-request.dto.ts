import { IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class SubmitSensitiveUpdateRequestDto {
  @IsUUID()
  targetEmployeeId!: string;

  @IsObject()
  changes!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}
