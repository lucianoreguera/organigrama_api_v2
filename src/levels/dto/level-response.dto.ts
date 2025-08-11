import { ApiProperty } from '@nestjs/swagger';

export class LevelResponseDto {
  @ApiProperty({
    description: 'ID único del nivel',
    example: '507f1f77bcf86cd799439011',
  })
  _id: string;

  @ApiProperty({
    description: 'Nombre del nivel',
    example: 'Principiante',
  })
  name: string;

  @ApiProperty({
    description: 'Descripción del nivel',
    example: 'Nivel ideal para personas que están comenzando a aprender',
  })
  description?: string;

  @ApiProperty({
    description: 'Fecha de creación del nivel',
    example: '2024-01-15T10:30:00Z',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización del nivel',
    example: '2024-01-20T15:45:00Z',
    format: 'date-time',
  })
  updatedAt: Date;
}
