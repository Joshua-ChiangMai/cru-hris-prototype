import { IsOptional, IsUUID } from 'class-validator';

export class HeadcountQueryDto {
  @IsOptional()
  @IsUUID()
  cityId?: string;
}
