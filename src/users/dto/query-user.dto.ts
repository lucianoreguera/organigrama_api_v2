import { PaginationDto } from '../../common/dto/pagination.dto';
import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QueryUserDto extends PaginationDto {
  @ApiProperty({
    description: 'Filtrar por rol',
    example: 'admin',
    required: false,
  })
  @IsString()
  @IsOptional()
  role?: string;

  @ApiProperty({
    description: 'Filtrar por departamento',
    example: 'IT',
    required: false,
  })
  @IsString()
  @IsOptional()
  department?: string;
}
