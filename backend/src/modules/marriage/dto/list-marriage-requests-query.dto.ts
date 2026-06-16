import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import {
  MARRIAGE_REQUEST_STATUS_VALUES,
  type MarriageRequestStatusValue,
} from '../../../common/constants/marriage-request-status';

export class ListMarriageRequestsQueryDto {
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
  @IsIn(MARRIAGE_REQUEST_STATUS_VALUES)
  status?: MarriageRequestStatusValue;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  pendingOnly?: boolean;
}
