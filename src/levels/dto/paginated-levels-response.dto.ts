import { ApiProperty } from '@nestjs/swagger';
import { LevelResponseDto } from './level-response.dto';

export class PaginatedLevelsResponseDto {
  @ApiProperty({
    description: 'Lista de niveles',
    type: [LevelResponseDto],
  })
  data: LevelResponseDto[];

  @ApiProperty({
    description: 'Información de paginación',
    example: {
      total: 50,
      page: 1,
      limit: 10,
      totalPages: 5,
      hasNext: true,
      hasPrev: false,
    },
  })
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
