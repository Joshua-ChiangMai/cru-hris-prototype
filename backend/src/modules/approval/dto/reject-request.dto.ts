import { IsString, MaxLength, MinLength } from 'class-validator';
import { ReviewRequestDto } from './review-request.dto';

export class RejectRequestDto extends ReviewRequestDto {
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  declare comment: string;
}
