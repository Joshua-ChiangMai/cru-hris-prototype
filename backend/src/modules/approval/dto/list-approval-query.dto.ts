import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import {
  APPROVAL_CHANGE_DOMAIN_VALUES,
  type ApprovalChangeDomainValue,
} from '../../../common/constants/approval-change-domain';
import {
  UPDATE_REQUEST_STATUS_VALUES,
  type UpdateRequestStatusValue,
} from '../../../common/constants/update-request-status';

export class ListApprovalQueryDto {
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
  limit?: number = 20;

  @IsOptional()
  @IsIn(UPDATE_REQUEST_STATUS_VALUES)
  status?: UpdateRequestStatusValue;

  @IsOptional()
  @IsUUID()
  cityId?: string;

  @IsOptional()
  @IsIn(APPROVAL_CHANGE_DOMAIN_VALUES)
  changeDomain?: ApprovalChangeDomainValue;

  /** When true, returns only APPROVED, REJECTED, and CANCELLED requests. */
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  history?: boolean;

  /** When true, returns only PENDING requests (HR approval queue). */
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  pendingOnly?: boolean;
}
