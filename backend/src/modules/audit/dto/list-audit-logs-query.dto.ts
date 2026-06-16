import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import {
  AUDIT_ACTION_VALUES,
  type AuditActionValue,
} from '../../../common/constants/audit-action';
import {
  AUDIT_ENTITY_VALUES,
  type AuditEntityValue,
} from '../../../common/constants/audit-entity';

export class ListAuditLogsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 25;

  @IsOptional()
  @IsUUID()
  actorUserId?: string;

  @IsOptional()
  @IsIn(AUDIT_ACTION_VALUES)
  action?: AuditActionValue;

  @IsOptional()
  @IsIn(AUDIT_ENTITY_VALUES)
  entity?: AuditEntityValue;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
