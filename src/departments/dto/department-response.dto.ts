import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeoPointDto } from './create-department.dto';

export class DepartmentResponseDto {
  @ApiProperty({
    description: 'ID único del departamento',
    example: '507f1f77bcf86cd799439011',
  })
  _id: string;

  @ApiProperty({
    description: 'Nombre del departamento',
    example: 'Departamento de Recursos Humanos',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Objetivo del departamento',
    example:
      'Gestionar el talento humano y promover el desarrollo profesional del personal',
  })
  objective?: string;

  @ApiPropertyOptional({
    description: 'Código del departamento',
    example: 'RRHH-01',
  })
  code?: string;

  @ApiPropertyOptional({
    description: 'Ubicación geográfica en formato GeoJSON',
    type: GeoPointDto,
  })
  geo_point?: GeoPointDto;

  @ApiPropertyOptional({
    description: 'Dirección física',
    example: 'Av. Belgrano 350, San Fernando del Valle de Catamarca',
  })
  address_text?: string;

  @ApiProperty({
    description: 'Estado del departamento',
    example: true,
  })
  is_active: boolean;

  @ApiProperty({
    description: 'Fecha de creación del departamento',
    example: '2024-01-15T10:30:00Z',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2024-01-20T15:45:00Z',
    format: 'date-time',
  })
  updatedAt: Date;
}
