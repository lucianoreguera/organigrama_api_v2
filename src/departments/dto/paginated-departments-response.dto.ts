import { ApiProperty } from '@nestjs/swagger';
import { DepartmentResponseDto } from './department-response.dto';

export class PaginatedDepartmentsResponseDto {
  @ApiProperty({
    description: 'Lista de departamentos',
    type: [DepartmentResponseDto],
  })
  data: DepartmentResponseDto[];

  @ApiProperty({
    description: 'Información de paginación',
    example: {
      total: 25,
      page: 1,
      limit: 10,
      totalPages: 3,
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
