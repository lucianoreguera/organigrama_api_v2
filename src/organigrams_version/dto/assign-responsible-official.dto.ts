import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class AssignResponsibleOfficialDto {
  @IsMongoId()
  @ApiProperty({ description: 'ID de la versión del organigrama' })
  versionId: string;

  @IsMongoId()
  @ApiProperty({ description: 'ID del funcionario responsable' })
  responsibleId: string;

  @IsMongoId()
  @ApiProperty({ description: 'ID del nodo de departamento' })
  nodeId: string;
}
