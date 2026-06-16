import { Type } from 'class-transformer';
import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  APPROVAL_CHANGE_DOMAIN_VALUES,
  type ApprovalChangeDomainValue,
} from '../../../common/constants/approval-change-domain';

export class SubmitChangeRequestDto {
  @IsUUID()
  targetEmployeeId!: string;

  @IsIn(APPROVAL_CHANGE_DOMAIN_VALUES)
  changeDomain!: ApprovalChangeDomainValue;

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
