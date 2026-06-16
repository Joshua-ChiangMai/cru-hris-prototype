import { IsArray, IsEmail, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsArray()
  @IsString({ each: true })
  roleCodes!: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  cityIds?: string[];
}
