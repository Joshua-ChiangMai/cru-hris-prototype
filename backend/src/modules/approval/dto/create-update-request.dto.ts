import { IsIn, IsObject, IsOptional, IsUUID } from 'class-validator';
import {
  UPDATE_REQUEST_TYPE_VALUES,
  type UpdateRequestTypeValue,
} from '../../../common/constants/update-request-type';

export class CreateUpdateRequestDto {
  @IsIn(UPDATE_REQUEST_TYPE_VALUES)
  requestType!: UpdateRequestTypeValue;

  @IsUUID()
  targetEmployeeId!: string;

  @IsOptional()
  @IsUUID()
  assignedApproverUserId?: string;

  @IsObject()
  payloadAfter!: Record<string, unknown>;
}
