import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class AssignResponsibleOfficialBodyDto {
  @IsMongoId()
  @ApiProperty({
    description: 'ID del funcionario responsable',
    example: '507f1f77bcf86cd799439011',
  })
  responsibleId: string;
}
