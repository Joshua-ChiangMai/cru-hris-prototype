import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateUserRolesDto {
  @IsArray()
  @IsString({ each: true })
  roleCodes!: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  cityIds?: string[];
}
