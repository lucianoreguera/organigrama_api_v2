import { ApiProperty } from '@nestjs/swagger';
import { PersonResponseDto } from './person-response.dto';

export class PaginatedPeopleResponseDto {
  @ApiProperty({
    description: 'Lista de personas',
    type: [PersonResponseDto],
  })
  data: PersonResponseDto[];

  @ApiProperty({
    description: 'Información de paginación',
    example: {
      total: 150,
      page: 1,
      limit: 10,
      totalPages: 15,
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
