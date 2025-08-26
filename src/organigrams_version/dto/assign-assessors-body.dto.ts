import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsArray, ArrayNotEmpty } from 'class-validator';

export class AssignAssessorsBodyDto {
  @IsArray()
  @ArrayNotEmpty({ message: 'Debe proporcionar al menos un asesor' })
  @IsMongoId({ each: true, message: 'Cada asesor debe ser un ObjectId válido' })
  @ApiProperty({
    description: 'Array de IDs de los asesores a asignar',
    type: [String],
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
  })
  assessorIds: string[];
}
