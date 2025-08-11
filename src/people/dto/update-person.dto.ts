import { PartialType } from '@nestjs/swagger'; // Cambiar a @nestjs/swagger
import { CreatePersonDto } from './create-person.dto';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { PersonType } from '../enums/person-type.enums';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePersonDto extends PartialType(CreatePersonDto) {
  @ApiPropertyOptional({
    description: 'Tipo de persona en el sistema',
    enum: PersonType,
    example: PersonType.ASSESSOR,
    enumName: 'PersonType',
  })
  @IsOptional()
  @IsEnum(PersonType, {
    message: `El tipo de persona debe ser uno de los siguientes valores: ${Object.values(PersonType).join(', ')}`,
  })
  person_type?: PersonType;

  @ValidateIf(
    (o) =>
      o.person_type === PersonType.OFFICIAL ||
      (o.person_type === undefined && o.job_title_text !== undefined),
  )
  @IsOptional()
  @IsNotEmpty({
    message:
      'El título del puesto no puede estar vacío si se provee para un funcionario',
  })
  @IsString()
  @MaxLength(150)
  job_title_text?: string;

  @ValidateIf(
    (o) =>
      o.person_type === PersonType.ASSESSOR ||
      (o.person_type === undefined && o.expertise_area !== undefined),
  )
  @IsOptional()
  @IsNotEmpty({
    message:
      'El área de especialización no puede estar vacía si se provee para un asesor',
  })
  @IsString()
  @MaxLength(150)
  expertise_area?: string;
}
