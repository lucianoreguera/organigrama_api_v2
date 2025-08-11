import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateLevelDto {
  @ApiProperty({
    description: 'Nombre del nivel',
    example: 'Modernización',
    minLength: 3,
    maxLength: 50,
  })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada del nivel',
    example: 'Area en el que se desarrollan las nuevas tecnologías',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
