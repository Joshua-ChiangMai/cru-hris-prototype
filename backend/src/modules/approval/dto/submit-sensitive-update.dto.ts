import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class SubmitSensitiveUpdateDto {
  @IsObject()
  changes!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}
