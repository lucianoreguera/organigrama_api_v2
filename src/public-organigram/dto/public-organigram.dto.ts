import { ApiProperty } from '@nestjs/swagger';

export class SecretariaResponseDto {
  @ApiProperty({
    description: 'ID del nodo de la secretaría',
    example: '507f1f77bcf86cd799439011',
  })
  id: string;

  @ApiProperty({
    description: 'Nombre de la secretaría',
    example: 'Secretaría de Obras Públicas',
  })
  nombre: string;

  @ApiProperty({
    description: 'Código del departamento',
    example: 'SOP',
    required: false,
  })
  codigo?: string;

  @ApiProperty({
    description: 'Objetivo del departamento',
    required: false,
  })
  objetivo?: string;
}

export class DepartmentFlatResponseDto {
  @ApiProperty({
    description: 'ID del nodo del departamento',
    example: '507f1f77bcf86cd799439012',
  })
  id: string;

  @ApiProperty({
    description: 'Nombre del departamento',
    example: 'Dirección de Arquitectura',
  })
  nombre: string;

  @ApiProperty({
    description: 'Código del departamento',
    example: 'DA',
    required: false,
  })
  codigo?: string;

  @ApiProperty({
    description: 'Nombre del nivel jerárquico',
    example: 'dirección',
  })
  nivel: string;

  @ApiProperty({
    description: 'Path jerárquico completo',
    example: 'Secretaría de Obras Públicas/Dirección de Arquitectura',
    required: false,
  })
  path_jerarquico?: string;

  @ApiProperty({
    description: 'Profundidad en la jerarquía (0 = raíz)',
    example: 2,
  })
  profundidad: number;
}
