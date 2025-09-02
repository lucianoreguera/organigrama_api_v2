// import {
//   IsString,
//   IsNotEmpty,
//   IsOptional,
//   IsDateString,
//   ValidateNested,
//   IsArray,
//   ArrayNotEmpty,
//   MaxLength,
// } from 'class-validator';
// import { Type } from 'class-transformer';
// import { DepartmentNodeInputDto } from './department-node-input.dto';

// export class CreateOrganigramVersionDto {
//   @IsString()
//   @IsNotEmpty()
//   @MaxLength(100)
//   version_tag: string;

//   @IsDateString()
//   @IsNotEmpty()
//   effective_date: string; // Se convertirá a Date en el servicio

//   @IsOptional()
//   @IsString()
//   description?: string;

//   @IsArray()
//   @ArrayNotEmpty({ message: 'La estructura de nodos no puede estar vacía.' })
//   @ValidateNested({ each: true })
//   @Type(() => DepartmentNodeInputDto)
//   nodes: DepartmentNodeInputDto[];
// }

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  ValidateNested,
  IsArray,
  ArrayNotEmpty,
  MaxLength,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DepartmentNodeInputDto } from './department-node-input.dto';

export class CreateOrganigramVersionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @ApiProperty({
    description: 'Etiqueta de la versión',
    example: 'v2.1.0',
  })
  version_tag: string;

  @IsDateString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Fecha efectiva de la versión',
    example: '2024-01-15T10:30:00Z',
  })
  effective_date: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Descripción de la versión',
    example: 'Reorganización del área de sistemas',
  })
  description?: string;

  @IsOptional()
  @IsMongoId()
  @ApiPropertyOptional({
    description:
      'ID del archivo PDF del decreto que autoriza la creación de la versión',
    example: '507f1f77bcf86cd799439011',
  })
  decree_file_id?: string;

  @IsArray()
  @ArrayNotEmpty({ message: 'La estructura de nodos no puede estar vacía.' })
  @ValidateNested({ each: true })
  @Type(() => DepartmentNodeInputDto)
  @ApiProperty({
    description: 'Estructura de nodos del organigrama',
    type: [DepartmentNodeInputDto],
  })
  nodes: DepartmentNodeInputDto[];
}
