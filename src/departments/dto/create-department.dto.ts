import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  Equals,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GeoPointDto {
  @ApiProperty({
    description: 'Tipo de geometría GeoJSON',
    example: 'Point',
    enum: ['Point'],
  })
  @IsString()
  @IsNotEmpty()
  @Equals('Point', { message: 'El tipo de geo_point debe ser "Point"' })
  type: 'Point';

  @ApiProperty({
    description: 'Coordenadas de longitud y latitud [lng, lat]',
    example: [-65.2176, -28.4696],
    type: [Number],
    minItems: 2,
    maxItems: 2,
  })
  @IsArray()
  @ArrayMinSize(2, {
    message: 'Las coordenadas deben tener exactamente 2 elementos',
  })
  @ArrayMaxSize(2, {
    message: 'Las coordenadas deben tener exactamente 2 elementos',
  })
  @IsNumber(
    {},
    { each: true, message: 'Cada coordenada debe ser un número válido' },
  )
  @Min(-180, { each: true, message: 'La longitud debe estar entre -180 y 180' })
  @Max(180, { each: true, message: 'La longitud debe estar entre -180 y 180' })
  coordinates: [number, number];
}

export class CreateDepartmentDto {
  @ApiProperty({
    description: 'Nombre del departamento',
    example: 'Departamento de Recursos Humanos',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del departamento es requerido' })
  @MaxLength(150, { message: 'El nombre no puede exceder los 150 caracteres' })
  name: string;

  @ApiPropertyOptional({
    description: 'Objetivo o propósito del departamento',
    example:
      'Gestionar el talento humano y promover el desarrollo profesional del personal',
  })
  @IsOptional()
  @IsString()
  objective?: string;

  @ApiPropertyOptional({
    description: 'Código identificador del departamento',
    example: 'RRHH-01',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'El código no puede exceder los 50 caracteres' })
  code?: string;

  @ApiPropertyOptional({
    description:
      'Ubicación geográfica del departamento en formato GeoJSON Point',
    type: GeoPointDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => GeoPointDto)
  geo_point?: GeoPointDto;

  @ApiPropertyOptional({
    description: 'Dirección física del departamento',
    example: 'Av. Belgrano 350, San Fernando del Valle de Catamarca',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, {
    message: 'La dirección no puede exceder los 255 caracteres',
  })
  address_text?: string;

  @ApiPropertyOptional({
    description: 'Indica si el departamento está activo en el sistema',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  is_active: boolean = true;
}
