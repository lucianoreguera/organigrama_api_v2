import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  ValidateNested,
  IsArray,
  ArrayNotEmpty,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DepartmentNodeInputDto } from './department-node-input.dto';

export class CreateOrganigramVersionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  version_tag: string;

  @IsDateString()
  @IsNotEmpty()
  effective_date: string; // Se convertirá a Date en el servicio

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ArrayNotEmpty({ message: 'La estructura de nodos no puede estar vacía.' })
  @ValidateNested({ each: true })
  @Type(() => DepartmentNodeInputDto)
  nodes: DepartmentNodeInputDto[];
}
