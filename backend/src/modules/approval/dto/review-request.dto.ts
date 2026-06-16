import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}
