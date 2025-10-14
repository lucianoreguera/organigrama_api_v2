import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateAppDto {
  @ApiProperty({
    description: 'Nombre del sistema que utilizará la API',
    example: 'Contrataciones',
    minLength: 3,
    maxLength: 50,
  })
  @IsString()
  @MinLength(3)
  name: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  apiKey?: string;
}
