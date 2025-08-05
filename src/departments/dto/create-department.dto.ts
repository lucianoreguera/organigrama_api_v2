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
} from 'class-validator';

export class GeoPointDto {
  @IsString()
  @IsNotEmpty()
  @Equals('Point', { message: 'El tipo de geo_point debe ser "Point".' })
  type: 'Point';

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsNumber({}, { each: true })
  coordinates: [number, number];
}

export class CreateDepartmentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsOptional()
  @IsString()
  objective?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => GeoPointDto)
  geo_point?: GeoPointDto;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address_text?: string;

  @IsBoolean()
  @IsOptional()
  is_active: boolean = true;
}
