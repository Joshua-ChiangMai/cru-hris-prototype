import { IsUUID } from 'class-validator';

export class SubmitMarriageRequestDto {
  @IsUUID()
  spouseEmployeeId!: string;
}
