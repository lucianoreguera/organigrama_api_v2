import {
  IsOptional,
  IsNumber,
  IsString,
  IsPositive,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationDto {
  @ApiPropertyOptional({
    description: 'Número de página a obtener',
    example: 1,
    minimum: 1,
    default: 1,
    type: 'integer',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Cantidad de elementos por página',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
    type: 'integer',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description:
      'Campo por el cual ordenar los resultados. Usar - para orden descendente',
    example: 'name',
    examples: {
      ascending: {
        value: 'name',
        description: 'Ordenar por nombre ascendente',
      },
      descending: {
        value: '-name',
        description: 'Ordenar por nombre descendente',
      },
      byDate: {
        value: '-createdAt',
        description: 'Ordenar por fecha de creación descendente',
      },
    },
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({
    description: 'Término de búsqueda para filtrar resultados',
    example: 'programación',
    minLength: 1,
  })
  @IsOptional()
  @IsString()
  search?: string;
}
