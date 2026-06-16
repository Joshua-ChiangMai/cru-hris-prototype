import { UpdateRequestType } from '@prisma/client';
import { IsEnum, IsObject, IsOptional, IsUUID } from 'class-validator';

export class CreateUpdateRequestDto {
  @IsEnum(UpdateRequestType)
  requestType!: UpdateRequestType;

  @IsUUID()
  targetEmployeeId!: string;

  @IsOptional()
  @IsUUID()
  assignedApproverUserId?: string;

  @IsObject()
  payloadAfter!: Record<string, unknown>;
}
