import { ApprovalChangeDomain } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class SubmitChangeRequestDto {
  @IsUUID()
  targetEmployeeId!: string;

  @IsEnum(ApprovalChangeDomain)
  changeDomain!: ApprovalChangeDomain;

  @IsObject()
  payloadBefore!: Record<string, unknown>;

  @IsObject()
  payloadAfter!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  changeSummary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}
