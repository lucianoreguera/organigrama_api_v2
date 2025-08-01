import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateLevelDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
