// import { Type } from 'class-transformer';
// import {
//   IsString,
//   IsNotEmpty,
//   IsOptional,
//   ValidateNested,
//   IsArray,
//   IsObject,
//   MaxLength,
//   IsMongoId,
// } from 'class-validator';

// export class DepartmentBaseInputDto {
//   @IsString()
//   @IsNotEmpty()
//   @MaxLength(150)
//   name: string;

//   @IsOptional()
//   @IsString()
//   @MaxLength(50)
//   code?: string;

//   @IsOptional()
//   @IsString()
//   objective?: string;
// }

// export class DepartmentNodeInputDto {
//   @IsString()
//   @IsNotEmpty()
//   frontend_id: string;

//   @IsOptional()
//   @IsString()
//   parentId?: string | null;

//   @ValidateNested()
//   @Type(() => DepartmentBaseInputDto)
//   @IsNotEmpty()
//   department_data: DepartmentBaseInputDto;

//   @IsString()
//   @IsNotEmpty()
//   @IsMongoId({ message: 'level_id debe ser un ObjectId válido de MongoDB' })
//   level_id: string;

//   @IsOptional()
//   @IsObject()
//   ui_hints?: Record<string, any>;

//   @IsOptional()
//   @IsArray()
//   @ValidateNested({ each: true })
//   @Type(() => DepartmentNodeInputDto)
//   children?: DepartmentNodeInputDto[];
// }

import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
  IsArray,
  IsObject,
  MaxLength,
  IsMongoId,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DepartmentBaseInputDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @ApiProperty({
    description: 'Nombre del departamento',
    example: 'Dirección de Sistemas',
  })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @ApiPropertyOptional({
    description: 'Código del departamento',
    example: 'DIR-SIS-01',
  })
  code?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Objetivo del departamento',
    example: 'Gestionar la infraestructura tecnológica',
  })
  objective?: string;
}

export class DepartmentNodeInputDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'ID único del frontend para este nodo',
    example: 'node-001',
  })
  frontend_id: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'ID del nodo padre (null para nodos raíz)',
    example: 'node-parent-001',
  })
  parentId?: string | null;

  @ValidateNested()
  @Type(() => DepartmentBaseInputDto)
  @IsNotEmpty()
  @ApiProperty({
    description: 'Datos del departamento',
    type: DepartmentBaseInputDto,
  })
  department_data: DepartmentBaseInputDto;

  @IsString()
  @IsNotEmpty()
  @IsMongoId({ message: 'level_id debe ser un ObjectId válido de MongoDB' })
  @ApiProperty({
    description: 'ID del nivel jerárquico',
    example: '507f1f77bcf86cd799439011',
  })
  level_id: string;

  // NUEVOS CAMPOS PARA ASIGNACIÓN DE PERSONAS
  @IsOptional()
  @IsMongoId()
  @ApiPropertyOptional({
    description:
      'ID del funcionario responsable a asignar (debe ser tipo official)',
    example: '507f1f77bcf86cd799439012',
  })
  responsible_official_id?: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  @ApiPropertyOptional({
    description: 'Array de IDs de asesores a asignar (deben ser tipo assessor)',
    type: [String],
    example: ['507f1f77bcf86cd799439013', '507f1f77bcf86cd799439014'],
  })
  assigned_assessor_ids?: string[];

  @IsOptional()
  @IsObject()
  @ApiPropertyOptional({
    description: 'Sugerencias de UI del frontend',
    example: { position: { x: 100, y: 200 } },
  })
  ui_hints?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DepartmentNodeInputDto)
  @ApiPropertyOptional({
    description: 'Nodos hijos',
    type: [DepartmentNodeInputDto],
  })
  children?: DepartmentNodeInputDto[];
}
