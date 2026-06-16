import { IsString, MaxLength, MinLength } from 'class-validator';

export class RejectMarriageRequestDto {
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  rejectionReason!: string;
}
