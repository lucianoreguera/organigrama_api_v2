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

export class DepartmentBaseInputDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @IsOptional()
  @IsString()
  objective?: string;
}

export class DepartmentNodeInputDto {
  @IsString()
  @IsNotEmpty()
  frontend_id: string;

  @IsOptional()
  @IsString()
  parentId?: string | null;

  @ValidateNested()
  @Type(() => DepartmentBaseInputDto)
  @IsNotEmpty()
  department_data: DepartmentBaseInputDto;

  @IsString()
  @IsNotEmpty()
  @IsMongoId({ message: 'level_id debe ser un ObjectId válido de MongoDB' })
  level_id: string;

  @IsOptional()
  @IsObject()
  ui_hints?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DepartmentNodeInputDto)
  children?: DepartmentNodeInputDto[];
}
