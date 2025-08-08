import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryLevelDto extends PaginationDto {
  // Agregar filtros específicos para levels si fuera necesario. Ejemplos
  // Por ejemplo:
  // @IsOptional()
  // @IsString()
  // name?: string;
  // @IsOptional()
  // @IsEnum(['active', 'inactive'])
  // status?: string;
}
